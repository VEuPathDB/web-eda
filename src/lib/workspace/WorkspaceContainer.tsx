import { find } from '@veupathdb/wdk-client/lib/Utils/IterableUtils';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import React, { useCallback, useMemo } from 'react';
import { useRouteMatch } from 'react-router';
import {
  DataClient,
  EDAWorkspaceContainer,
  StudyMetadata,
  SubsettingClient,
} from '../core';
import { Variable } from '../core/types/variable';
import { EDAWorkspaceHeading } from './EDAWorkspaceHeading';
import { mockAnalysisStore } from './Mocks';
import { AnalysisPanel } from './AnalysisPanel';
import { cx, findFirstVariable } from './Utils';

interface Props {
  studyId: string;
  analysisId: string;
  subsettingServiceUrl: string;
  dataServiceUrl: string;
}
export function WorkspaceContainer(props: Props) {
  const { url } = useRouteMatch();
  const subsettingClient = useMemo(
    () => new SubsettingClient({ baseUrl: props.subsettingServiceUrl }),
    [props.subsettingServiceUrl]
  );
  const dataClient = useMemo(
    () => new DataClient({ baseUrl: props.subsettingServiceUrl }),
    [props.subsettingServiceUrl]
  );
  const makeVariableLink = useCallback(
    (
      {
        entityId: maybeEntityId,
        variableId: maybeVariableId,
      }: Partial<Variable>,
      studyMetadata: StudyMetadata
    ) => {
      const entityId = maybeEntityId ?? studyMetadata.rootEntity.id;
      const entity = find(
        (entity) => entity.id === entityId,
        preorder(studyMetadata.rootEntity, (e) => e.children ?? [])
      );
      const variableId =
        maybeVariableId ?? findFirstVariable(entity.variables, entityId)?.id;
      return entityId && variableId
        ? `${url}/variables/${entityId}/${variableId}`
        : entityId
        ? `${url}/variables/${entityId}`
        : `${url}/variables`;
    },
    [url]
  );
  return (
    <EDAWorkspaceContainer
      analysisId={props.analysisId}
      studyId={props.studyId}
      className={cx()}
      analysisClient={mockAnalysisStore}
      dataClient={dataClient}
      subsettingClient={subsettingClient}
      makeVariableLink={makeVariableLink}
    >
      <EDAWorkspaceHeading />
      <AnalysisPanel analysisId={props.analysisId} />
    </EDAWorkspaceContainer>
  );
}
