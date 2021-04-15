import PopoverButton from '@veupathdb/components/lib/components/widgets/PopoverButton';
import { getTree } from '@veupathdb/wdk-client/lib/Components/AttributeFilter/AttributeFilterUtils';
import { keyBy } from 'lodash';
import { useMemo } from 'react';
import { StudyEntity } from '../types/study';
import { edaVariableToWdkField } from '../utils/wdk-filter-param-adapter';
import VariableList from './VariableList';
import './VariableTree.scss';

export interface Props {
  entities: StudyEntity[];
  entityId?: string;
  variableId?: string;
  /** term string is of format "entityId/variableId"  e.g. "PCO_0000024/EUPATH_0000714" */
  onActiveFieldChange: (term?: string) => void;
}
export function VariableTree(props: Props) {
  const { entities, entityId, variableId, onActiveFieldChange } = props;
  const fields = useMemo(() => {
    return entities.flatMap((entity) => {
      // Create a Set of variableId so we can lookup parentIds
      const variableIds = new Set(entity.variables.map((v) => v.id));
      return [
        // Create a non-filterable field for the entity.
        // Note that we're prefixing the term. This avoids
        // collisions with variables using the same term.
        // This situation shouldn't happen in production,
        // but there is nothing preventing it, so we need to
        // handle the case.
        {
          term: `entity:${entity.id}`,
          display: entity.displayName,
        },
        ...entity.variables
          // Before handing off to edaVariableToWdkField, we will
          // change the id of the variable to include the entityId.
          // This will make the id unique across the tree and prevent
          // duplication across entity subtrees.
          .map((variable) => ({
            ...variable,
            id: `${entity.id}/${variable.id}`,
            parentId:
              // Use entity as parent under the following conditions:
              // - if parentId is null
              // - if the parentId is the same as the entityId
              // - if the parentId does not exist in the provided list of variables
              //
              // Variables that meet any of these conditions will serve
              // as the root nodes of the variable subtree, which will
              // become the children of the entity node in the final tree.
              variable.parentId == null ||
              variable.parentId === entity.id ||
              !variableIds.has(variable.parentId)
                ? `entity:${entity.id}`
                : `${entity.id}/${variable.parentId}`,
          }))
          .map(edaVariableToWdkField),
      ];
    });
  }, [entities]);

  // Construct the fieldTree using the fields defined above.
  const fieldTree = useMemo(() => {
    const fieldTree = getTree(fields);
    return fieldTree;
  }, [fields]);

  // Used to lookup a field by entityId and variableId.
  const fieldsByTerm = useMemo(() => keyBy(fields, (f) => f.term), [fields]);

  // Lookup activeField
  const activeField =
    entityId && variableId
      ? fieldsByTerm[`${entityId}/${variableId}`]
      : undefined;

  // TODO Populate valuesMap with properties of variables.
  // This is used by the search functionality of FieldList.
  // It should be a map from field term to string.
  // In WDK searches, this is a concatenated string of values
  // for categorical-type variables.
  const valuesMap: Record<string, string> = {};

  return (
    <VariableList
      activeField={activeField}
      onActiveFieldChange={onActiveFieldChange}
      valuesMap={valuesMap}
      fieldTree={fieldTree}
      autoFocus={false}
    />
  );
}

export function VariableTreeDropdown(props: Props) {
  const { entities, entityId, variableId, onActiveFieldChange } = props;
  const variable = entities
    .find((e) => e.id === entityId)
    ?.variables.find((v) => v.id === variableId);
  const label = variable?.displayName ?? 'Select a variable';
  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      <PopoverButton label={label} key={`${entityId}/${variableId}`}>
        <div
          style={{
            border: '1px solid',
            borderRadius: ' 0.25em',
            padding: '0.5em',
            height: '60vh',
            width: '30em',
            position: 'relative',
          }}
        >
          <VariableTree {...props} />
        </div>
      </PopoverButton>
      {variable && (
        <button
          type="button"
          style={{ position: 'absolute', bottom: '-1.5em', right: 0 }}
          className="link"
          onClick={() => onActiveFieldChange()}
        >
          clear
        </button>
      )}
    </div>
  );
}
