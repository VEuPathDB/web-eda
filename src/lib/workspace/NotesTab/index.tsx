import { useEffect, useState, useMemo } from 'react';
import { debounce } from 'lodash';

// Definitions
import { AnalysisState } from '../../core';

// Components
import MultilineTextField, {
  MultilineTextFieldProps,
} from '@veupathdb/core-components/dist/components/forms/MultilineTextField';

type props = {
  analysisState: AnalysisState;
};

export default function NotesTab({ analysisState }: props) {
  const {
    setDescription: setAnalysisDescription,
    setDetails: setAnalysisDetails,
  } = analysisState;

  const [description, setDescription] = useState(
    analysisState.analysis?.description ?? ''
  );
  const [details, setDetails] = useState(analysisState.analysis?.details ?? '');

  const [descriptionStatus, setDescriptionStatus] = useState<
    MultilineTextFieldProps['status']
  >();
  const [detailsStatus, setDetailsStatus] = useState<
    MultilineTextFieldProps['status']
  >();

  const syncDescriptionToAnalysis = useMemo(
    () =>
      debounce((value: string) => {
        setAnalysisDescription(value);
        setDescriptionStatus('synced');
      }, 1000),
    [setAnalysisDescription]
  );

  const syncDetailsToAnalysis = useMemo(
    () =>
      debounce((value: string) => {
        setAnalysisDetails(value);
        setDetailsStatus('synced');
      }, 1000),
    [setAnalysisDetails]
  );

  useEffect(() => {
    console.log('STORED DESCRIPTION', analysisState.analysis?.description);
  }, [analysisState.analysis?.description]);

  useEffect(() => {
    console.log('STORED DETAILS', analysisState.analysis?.details);
  }, [analysisState.analysis?.details]);

  return (
    <div
      style={{
        marginTop: 25,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <MultilineTextField
        heading="Analysis Description"
        instructions='Provide a brief summary of the analysis. This will show in the "Description" column in the My analyses and Public analyses tables.'
        width="60vw"
        height="17.5vh"
        characterLimit={255}
        value={description}
        onValueChange={(value) => {
          setDescription(value);
          setDescriptionStatus('syncing');
          syncDescriptionToAnalysis(value);
        }}
        status={descriptionStatus}
      />
      <div style={{ height: 25 }} />
      <MultilineTextField
        heading="Analysis Details"
        instructions="Record details of your analysis for yourself and those you share it with."
        width="60vw"
        height="50vh"
        value={details}
        onValueChange={(value) => {
          setDetails(value);
          setDetailsStatus('syncing');
          syncDetailsToAnalysis(value);
        }}
        status={detailsStatus}
      />
    </div>
  );
}
