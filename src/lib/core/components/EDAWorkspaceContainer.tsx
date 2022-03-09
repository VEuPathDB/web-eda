import React, { ReactNode, useMemo } from 'react';

import { Loading } from '@veupathdb/wdk-client/lib/Components';
import { TreeNode } from '@veupathdb/wdk-client/lib/Components/AttributeFilter/Types';

import SubsettingClient from '../api/SubsettingClient';
import DataClient from '../api/DataClient';
import { AnalysisClient } from '../api/analysis-api';
import {
  MakeVariableLink,
  WorkspaceContext,
} from '../context/WorkspaceContext';
import {
  HookValue as WdkStudyRecord,
  useStudyEntities,
  useStudyMetadata,
  useWdkStudyRecord,
} from '../hooks/study';

import { FieldWithMetadata, StudyMetadata } from '..';

import { useFieldTree, useFlattenedFields } from './variableTrees/hooks';
import { DownloadClient } from '../api/DownloadClient';
import { useWdkService } from '@veupathdb/wdk-client/lib/Hooks/WdkServiceHook';

export interface Props {
  studyId: string;
  children: ReactNode;
  className?: string;
  analysisClient: AnalysisClient;
  subsettingClient: SubsettingClient;
  downloadClient: DownloadClient;
  dataClient: DataClient;
  initializeMakeVariableLink?: (
    fieldTree: TreeNode<FieldWithMetadata>
  ) => MakeVariableLink;
}

/** Just a data container... but note that it also provides a material ui theme... */
export function EDAWorkspaceContainer(props: Props) {
  const { studyId, subsettingClient } = props;

  const wdkStudyRecordState = useWdkStudyRecord(studyId);
  const studyMetadata = useStudyMetadata(studyId, subsettingClient);
  if (wdkStudyRecordState == null || studyMetadata == null) return <Loading />;
  return (
    <EDAWorkspaceContainerWithLoadedData
      {...props}
      wdkStudyRecord={wdkStudyRecordState}
      studyMetadata={studyMetadata}
    />
  );
}

export interface LoadedDataProps extends Props {
  wdkStudyRecord: WdkStudyRecord;
  studyMetadata: StudyMetadata;
}

function EDAWorkspaceContainerWithLoadedData({
  children,
  className = 'EDAWorkspace',
  analysisClient,
  subsettingClient,
  dataClient,
  downloadClient,
  initializeMakeVariableLink,
  wdkStudyRecord,
  studyMetadata,
}: LoadedDataProps) {
  const entities = useStudyEntities(studyMetadata.rootEntity);
  const variableTreeFields = useFlattenedFields(entities, 'variableTree');
  const variableTree = useFieldTree(variableTreeFields);

  const makeVariableLink = useMemo(
    () => initializeMakeVariableLink?.(variableTree),
    [initializeMakeVariableLink, variableTree]
  );

  const projectId = useWdkService((wdkService) => wdkService.getConfig(), [])
    ?.projectId;
  console.log(projectId);

  return (
    <WorkspaceContext.Provider
      value={{
        ...wdkStudyRecord,
        studyMetadata,
        analysisClient,
        subsettingClient,
        dataClient,
        downloadClient,
        makeVariableLink,
      }}
    >
      <div className={className}>{children}</div>
    </WorkspaceContext.Provider>
  );
}
