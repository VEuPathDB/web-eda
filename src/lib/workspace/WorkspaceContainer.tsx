import { useCallback, useMemo } from 'react';
import { useRouteMatch } from 'react-router';

import { find } from '@veupathdb/wdk-client/lib/Utils/IterableUtils';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { RestrictedPage } from '@veupathdb/web-common/lib/App/DataRestriction/RestrictedPage';
import { useApprovalStatus } from '@veupathdb/web-common/lib/hooks/dataRestriction';
import { EDAWorkspaceContainer, StudyMetadata } from '../core';
import SubsettingClient from '../core/api/SubsettingClient';
import DataClient from '../core/api/DataClient';
import { useConfiguredAnalysisClient } from '../core/hooks/analysisClient';
import { VariableDescriptor } from '../core/types/variable';
import { EDAWorkspace } from './EDAWorkspace';
import { cx, findFirstVariable } from './Utils';

import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  root: {
    '& .MuiTypography-root': {
      textTransform: 'none',
    },
  },
});

interface Props {
  studyId: string;
  analysisId?: string;
  subsettingServiceUrl: string;
  dataServiceUrl: string;
  userServiceUrl: string;
}

/** Allows a user to create a new analysis or edit an existing one. */
export function WorkspaceContainer({
  studyId,
  analysisId,
  subsettingServiceUrl,
  dataServiceUrl,
  userServiceUrl,
}: Props) {
  const { url } = useRouteMatch();
  const subsettingClient = useMemo(
    () => new SubsettingClient({ baseUrl: subsettingServiceUrl }),
    [subsettingServiceUrl]
  );
  const dataClient = useMemo(
    () => new DataClient({ baseUrl: dataServiceUrl }),
    [dataServiceUrl]
  );
  const analysisClient = useConfiguredAnalysisClient(userServiceUrl);
  const makeVariableLink = useCallback(
    (
      {
        entityId: maybeEntityId,
        variableId: maybeVariableId,
      }: Partial<VariableDescriptor>,
      studyMetadata: StudyMetadata
    ) => {
      const entityId = maybeEntityId ?? studyMetadata.rootEntity.id;
      const entity = find(
        (entity) => entity.id === entityId,
        preorder(studyMetadata.rootEntity, (e) => e.children ?? [])
      );
      const variableId =
        maybeVariableId ??
        (entity.variables.length !== 0 &&
          findFirstVariable(entity.variables)?.id);
      return entityId && variableId
        ? `${url}/variables/${entityId}/${variableId}`
        : entityId
        ? `${url}/variables/${entityId}`
        : `${url}/variables`;
    },
    [url]
  );
  const approvalStatus = useApprovalStatus(studyId, 'analysis');
  const classes = useStyles();

  return (
    <RestrictedPage approvalStatus={approvalStatus}>
      <EDAWorkspaceContainer
        studyId={studyId}
        className={`${cx()} ${classes.root}`}
        analysisClient={analysisClient}
        dataClient={dataClient}
        subsettingClient={subsettingClient}
        makeVariableLink={makeVariableLink}
      >
        <EDAWorkspace studyId={studyId} analysisId={analysisId} />
      </EDAWorkspaceContainer>
    </RestrictedPage>
  );
}
