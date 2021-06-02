import ErrorStatus from '@veupathdb/wdk-client/lib/Components/PageStatus/Error';
import React from 'react';
import { SubsettingClient } from '../api/subsetting-api';
import { DataClient } from '../api/data-api';
import { AnalysisClient } from '../api/analysis-api';
import {
  MakeVariableLink,
  WorkspaceContext,
} from '../context/WorkspaceContext';
import { useStudyMetadata, useWdkStudyRecord } from '../hooks/study';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core';
import { workspaceTheme } from './workspaceTheme';

const theme = createMuiTheme(workspaceTheme);
export interface Props {
  studyId: string;
  analysisId: string;
  children: React.ReactChild | React.ReactChild[];
  className?: string;
  analysisClient: AnalysisClient;
  subsettingClient: SubsettingClient;
  dataClient: DataClient;
  makeVariableLink?: MakeVariableLink;
}

export function EDAWorkspaceContainer(props: Props) {
  const {
    studyId,
    analysisClient,
    subsettingClient,
    dataClient,
    children,
    className = 'EDAWorkspace',
    makeVariableLink,
  } = props;
  const wdkStudyRecordState = useWdkStudyRecord(studyId);
  const { value: studyMetadata, error: studyMetadataError } = useStudyMetadata(
    studyId,
    subsettingClient
  );
  if (studyMetadataError)
    return (
      <ErrorStatus>
        <h2>Unable to load study metadata</h2>
        <pre>{String(studyMetadataError)}</pre>
      </ErrorStatus>
    );
  if (wdkStudyRecordState == null || studyMetadata == null) return null;
  return (
    <WorkspaceContext.Provider
      value={{
        ...wdkStudyRecordState,
        studyMetadata,
        analysisClient,
        subsettingClient,
        dataClient,
        makeVariableLink,
      }}
    >
      <ThemeProvider theme={theme}>
        <div className={className}>{children}</div>
      </ThemeProvider>
    </WorkspaceContext.Provider>
  );
}
