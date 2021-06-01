import React from 'react';
import { useHistory } from 'react-router';
import {
  EntityDiagram,
  SessionState,
  useMakeVariableLink,
  useStudyMetadata,
} from '../core';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { cx } from './Utils';
import { Variable } from './Variable';
import { useEntityCounts } from '../core/hooks/entityCounts';
import { useToggleStarredVariable } from '../core/hooks/starredVariables';
import { VariableTree } from '../core/components/VariableTree';
import FilterChipList from '../core/components/FilterChipList';
import { uniq } from 'lodash';

interface Props {
  sessionState: SessionState;
  entityId: string;
  variableId: string;
}

export function Subsetting(props: Props) {
  const { entityId, variableId, sessionState } = props;
  const studyMetadata = useStudyMetadata();
  const entities = Array.from(
    preorder(studyMetadata.rootEntity, (e) => e.children || [])
  );
  const entity = entities.find((e) => e.id === entityId);
  const variable = entity?.variables.find((v) => v.id === variableId);
  const history = useHistory();
  const totalCounts = useEntityCounts();
  const filteredCounts = useEntityCounts(sessionState.session?.filters);
  const makeVariableLink = useMakeVariableLink();

  const toggleStarredVariable = useToggleStarredVariable(sessionState);

  if (entity == null || variable == null)
    return <div>Could not find specified variable.</div>;

  const totalEntityCount = totalCounts.value && totalCounts.value[entity.id];
  const filteredEntityCount =
    filteredCounts.value && filteredCounts.value[entity.id];
  const filteredEntities = uniq(
    sessionState.session?.filters.map((f) => f.entityId)
  );

  return (
    <div className={cx('-Subsetting')}>
      <div className="Entities">
        <EntityDiagram
          expanded
          orientation="horizontal"
          selectedEntity={entity.displayName}
          entityCounts={totalCounts.value}
          filteredEntityCounts={filteredCounts.value}
          filteredEntities={filteredEntities}
        />
      </div>
      <div className="Variables">
        <div
          style={{
            padding: '.5em',
            height: '60vh',
            width: '30em',
            position: 'relative',
          }}
        >
          <VariableTree
            rootEntity={entities[0]}
            entityId={entity.id}
            starredVariables={sessionState.session?.starredVariables}
            toggleStarredVariable={toggleStarredVariable}
            variableId={variable.id}
            onChange={(variable) => {
              if (variable) {
                const { entityId, variableId } = variable;
                history.replace(
                  makeVariableLink({ entityId, variableId }, studyMetadata)
                );
              } else history.replace('..');
            }}
          />
        </div>
      </div>
      <div className="EntityDetails">
        <h2>{entity.displayName}</h2>
        {filteredEntityCount && totalEntityCount && (
          <h3>
            {filteredEntityCount.toLocaleString()} of{' '}
            {totalEntityCount.toLocaleString()} (
            {(filteredEntityCount / totalEntityCount).toLocaleString('en-us', {
              style: 'percent',
            })}
            )
          </h3>
        )}
      </div>
      <div className="FilterChips">
        <FilterChipList
          filters={sessionState.session?.filters}
          setFilters={sessionState.setFilters}
          entities={entities}
          selectedEntityId={entity.id}
          selectedVariableId={variable.id}
        />
      </div>
      <div className="Filter">
        <Variable
          entity={entity}
          variable={variable}
          sessionState={sessionState}
          totalEntityCount={totalEntityCount}
          filteredEntityCount={filteredEntityCount}
        />
      </div>
    </div>
  );
}
