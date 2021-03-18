import {
  SessionState,
  StudyEntity,
  StudyVariable,
  useSession,
  useStudyMetadata,
} from '../core';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import React, { useCallback, useEffect, useState } from 'react';
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
import { VariableTree } from './VariableTree';
//DKDK utility functions to find field based on term (link)
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
  const [activeEntity, setActiveEntity] = useState<StudyEntity>(entity);
  const [activeVariable, setActiveVariable] = useState<StudyVariable>(variable);

  const onVariableChange = useCallback(
    (newEntity: StudyEntity, newVariable: StudyVariable) => {
      if (newEntity !== null) {
        setActiveEntity(newEntity);
        if (newVariable !== null) {
          setActiveVariable(newVariable);
        }
      }
    },
    [setActiveEntity, setActiveVariable]
  );

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
        <VariableTree entities={entities} onVariableChange={onVariableChange} />
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
