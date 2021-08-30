import React, { useMemo } from 'react';

// Components
import { RestrictedPage } from '@veupathdb/web-common/lib/App/DataRestriction/RestrictedPage';
import { EDAAnalysisListContainer } from '../core';
import { EDAWorkspaceHeading } from './EDAWorkspaceHeading';
import { AnalysisList } from './AnalysisList';

// Data and Utilities
import { useApprovalStatus } from '@veupathdb/web-common/lib/hooks/dataRestriction';
import { SubsettingClient } from '../core/api/subsetting-api';
import { DataClient } from '../core/api/data-api';
import { mockAnalysisStore } from './Mocks';
import { cx } from './Utils';

export interface Props {
  studyId: string;
  subsettingServiceUrl: string;
  dataServiceUrl: string;
}

/**
 * Component displayed when a study is chosen from StudyList.
 */
export function EDAAnalysisList(props: Props) {
  const subsettingClient: SubsettingClient = useMemo(
    () => new SubsettingClient({ baseUrl: props.subsettingServiceUrl }),
    [props.subsettingServiceUrl]
  );

  const dataClient: DataClient = useMemo(
    () => new DataClient({ baseUrl: props.dataServiceUrl }),
    [props.dataServiceUrl]
  );

  const approvalStatus = useApprovalStatus(props.studyId, 'analysis');

  return (
    <RestrictedPage approvalStatus={approvalStatus}>
      <EDAAnalysisListContainer
        studyId={props.studyId}
        subsettingClient={subsettingClient}
        dataClient={dataClient}
        className={cx()}
        analysisClient={mockAnalysisStore}
      >
        <EDAWorkspaceHeading />
        <AnalysisList analysisStore={mockAnalysisStore} />
      </EDAAnalysisListContainer>
    </RestrictedPage>
  );
}
