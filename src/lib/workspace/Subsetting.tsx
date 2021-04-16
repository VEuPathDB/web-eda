import React, { useEffect } from 'react';
import { useHistory } from 'react-router';
import {
  EntityDiagram,
  SessionState,
  StudyEntity,
  StudyVariable,
  useStudyMetadata,
} from '../core';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { cx } from './Utils';
import { Variable } from './Variable';
import { useEntityCounts } from '../core/hooks/entityCounts';
import { VariableTree } from '../core/components/VariableTree';
import FilterChipList from '../core/components/FilterChipList';

interface RouteProps {
  sessionState: SessionState;
  entityId?: string;
  variableId?: string;
}

export function SubsettingRoute(props: RouteProps) {
  const { variableId, entityId, sessionState } = props;
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
      sessionState={sessionState}
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
  const history = useHistory();
  const totalCounts = useEntityCounts();
  const filteredCounts = useEntityCounts(sessionState.session?.filters);
  const totalEntityCount = totalCounts.value && totalCounts.value[entity.id];
  const filteredEntityCount =
    filteredCounts.value && filteredCounts.value[entity.id];

  return (
    <div className={cx('-Subsetting')}>
      <div>
        <h2 style={{ textAlign: 'center' }}>ENTITIES</h2>
        <div style={{ paddingTop: '10px' }}>
          <EntityDiagram
            expanded={false}
            orientation="vertical"
            size={{ height: 300, width: 150 }}
            selectedEntity={entity.displayName}
            entityCounts={totalCounts.value}
            filteredEntityCounts={filteredCounts.value}
          />
        </div>
      </div>
      <div>
        <h2>VARIABLES</h2>
        {/* add box? */}
        <div
          style={{
            border: '1px solid',
            borderRadius: '.25em',
            padding: '.5em',
            height: '80vh',
            width: '30em',
            // overflow: 'auto',
            position: 'relative',
          }}
        >
          <VariableTree
            entities={entities}
            entityId={entity.id}
            variableId={variable.id}
            onChange={(variable) => {
              if (variable)
                history.replace(
                  `../${variable.entityId}/${variable.variableId}`
                );
              else history.replace('`..');
            }}
          />
        </div>
      </div>
      <div>
        <FilterChipList
          sessionState={sessionState}
          entities={entities}
          selectedEntityId={entity.id}
          selectedVariableId={variable.id}
        />
        <br />
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
