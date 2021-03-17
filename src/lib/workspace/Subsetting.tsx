import {
  SessionState,
  StudyEntity,
  StudyVariable,
  useSession,
  useStudyMetadata,
} from '../core';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { cx } from './Utils';
import { Variable } from './Variable';
import { useEntityCounts } from '../core/hooks/entityCounts';
import { VariableLink } from '../core/components/VariableLink';

/*
 * DKDK variable tree related ones
 */
//DKDK make css
import './VariableTreeCSS.css';
//DKDK variable tree component
import { VariableTree, activeFieldProp } from './VariableTree';
//DKDK utility functions to find field based on term (link)
import {
  findDefaultTreeVariable,
  findDefaultActiveField,
  returnFound,
  searchParent,
} from './UtilsFuncs';

interface RouteProps {
  sessionId: string;
  entityId?: string;
  variableId?: string;
}

export function SubsettingRoute(props: RouteProps) {
  const { variableId, entityId, sessionId } = props;
  const session = useSession(sessionId);
  const studyMetadata = useStudyMetadata();
  const history = useHistory();
  const entities = Array.from(
    preorder(studyMetadata.rootEntity, (e) => e.children || [])
  );
  const entity = entityId
    ? entities.find((e) => e.id === entityId)
    : entities[0];
  const variable =
    entity &&
    ((variableId && entity.variables.find((v) => v.id === variableId)) ||
      entity.variables.find((v) => v.dataShape != null));
  useEffect(() => {
    if (entity != null && variable != null) {
      if (entityId == null)
        history.replace(
          `${history.location.pathname}/${entity.id}/${variable.id}`
        );
      else if (variableId == null)
        history.replace(`${history.location.pathname}/${variable.id}`);
    }
  }, [entityId, variableId, entity, variable, history]);
  if (entity == null || variable == null)
    return <div>Could not find specified variable.</div>;
  // Prevent <Variables> from rendering multiple times
  if (entityId == null || variableId == null) return null;
  return (
    <Subsetting
      sessionState={session}
      entity={entity}
      entities={entities}
      variable={variable}
    />
  );
}

interface Props {
  sessionState: SessionState;
  entity: StudyEntity;
  entities: StudyEntity[];
  variable: StudyVariable;
}

export function Subsetting(props: Props) {
  const { entity, entities, variable, sessionState } = props;
  const totalCounts = useEntityCounts();
  const filteredCounts = useEntityCounts(sessionState.session?.filters);
  const totalEntityCount = totalCounts.value && totalCounts.value[entity.id];
  const filteredEntityCount =
    filteredCounts.value && filteredCounts.value[entity.id];

  //DKDK make useStates for several parameters/props
  const [activeEntity, setActiveEntity] = useState(entities[0]);
  //DKDK find initial tree variable
  const defaultActiveVariable = findDefaultTreeVariable(entities);
  const defaultActiveField = findDefaultActiveField(defaultActiveVariable);
  //DKDK make tree link work
  const [activeVariable, setActiveVariable] = useState(defaultActiveVariable);

  // // console.log('entities[0] = ', entities[0])
  // console.log('defaultActiveVariable =', defaultActiveVariable);
  // console.log("defaultActiveField = ", defaultActiveField);

  // const [activeField, setActiveField] = useState<activeFieldProp | null>(null);
  const [activeField, setActiveField] = useState<activeFieldProp | null>(
    defaultActiveField
  );
  //DKDK get fieldTree from VariableTree component for changing distribution
  const [fieldTree, setFieldTree] = useState({});
  // const [activeVariable, setActiveVariable] = useState('');

  //DKDK handling activeField - activeField is somehow not working yet
  const onActiveFieldChange = (term: any) => {
    // console.log('onActiveFieldChange data =', term)

    //DKDK find entity for data and assign it to activeEntity - note that resultParent returns array
    let resultParent = searchParent(term, entities);
    // console.log('result = ', resultParent)
    setActiveEntity(resultParent[0]);

    //DKDK find and set variable from fieldTree's term (entities' id)
    let resultVariable = returnFound(entities, { id: term });
    // console.log('resultVariable =', resultVariable)
    if (Array.isArray(resultVariable)) {
      setActiveVariable(resultVariable[0]);
    } else {
      setActiveVariable(resultVariable);
    }

    //DKDK find and set activeField from fieldTree's term
    let resultActiveField = returnFound(fieldTree, { term: term });
    // console.log('resultActiveField =', resultActiveField)
    if (Array.isArray(resultActiveField)) {
      setActiveField(resultActiveField[1]);
    } else {
      setActiveField(resultActiveField);
    }

    // console.log('new activeVariable =', activeVariable)
    // console.log('new activeField = ', activeField)
  };

  return (
    <div className={cx('-Subsetting')}>
      {/* <div>
        <h2>ENTITIES</h2>
        <ul
          style={{
            border: '1px solid',
            borderRadius: '.25em',
            height: '80vh',
            overflow: 'auto',
            padding: '1em 2em',
            margin: 0,
          }}
        >
          {entities.map((e) => (
            <li>
              <VariableLink
                replace
                style={e.id === entity.id ? { fontWeight: 'bold' } : undefined}
                entityId={e.id}
                variableId={
                  e.variables.find((v) => v.displayType != null)?.id ?? ''
                }
              >
                {e.displayName}
              </VariableLink>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>VARIABLES</h2>
        <ul
          style={{
            border: '1px solid',
            borderRadius: '.25em',
            height: '80vh',
            overflow: 'auto',
            padding: '1em 2em',
            margin: 0,
          }}
        >
          {entity.variables.map(
            (v) =>
              v.dataShape && (
                <li>
                  <VariableLink
                    replace
                    style={
                      v.id === variable.id ? { fontWeight: 'bold' } : undefined
                    }
                    entityId={entity.id}
                    variableId={v.id}
                  >
                    {v.displayName} ({v.dataShape} {v.type})
                  </VariableLink>
                </li>
              )
          )}
        </ul>
      </div> */}

      {/* DKDK add variableTree here */}
      <div
        className="VariableTreeClass"
        style={{ width: '25%', float: 'left' }}
      >
        <VariableTree
          entities={entities}
          setFieldTree={setFieldTree}
          onActiveFieldChange={onActiveFieldChange}
          activeField={activeField}
        />
      </div>

      <div>
        <Variable
          //DKDK make link work (for clicking variable): changing entity and variable props
          entity={activeEntity}
          variable={activeVariable}
          sessionState={sessionState}
          totalEntityCount={totalEntityCount}
          filteredEntityCount={filteredEntityCount}
        />
      </div>
    </div>
  );
}
