import { useEffect, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import Path from 'path';

// Components
import {
  // Download,
  Table,
} from '@veupathdb/core-components/dist/components/icons';

import FloatingButton from '@veupathdb/core-components/dist/components/buttons/FloatingButton';
import { safeHtml } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import { AnalysisNameDialog } from './AnalysisNameDialog';
import AddIcon from '@material-ui/icons/Add';

// Hooks
import { useStudyRecord } from '../core/hooks/workspace';
// import { useAttemptActionCallback } from '@veupathdb/study-data-access/lib/data-restriction/dataRestrictionHooks';

// Definitions & Utilities
import { cx } from './Utils';
import { AnalysisState, DEFAULT_ANALYSIS_NAME } from '../core';
// import { LinkAttributeValue } from '@veupathdb/wdk-client/lib/Utils/WdkModel';
// import { Action } from '@veupathdb/study-data-access/lib/data-restriction/DataRestrictionUiActions';
import { getAnalysisId, isSavedAnalysis } from '../core/utils/analysis';

interface EDAWorkspaceHeadingProps {
  /** Optional AnalysisState for "New analysis" button functionality */
  analysisState?: AnalysisState;
}

/** Study Header Component */
export function EDAWorkspaceHeading({
  analysisState,
}: EDAWorkspaceHeadingProps) {
  const studyRecord = useStudyRecord();
  // const attemptAction = useAttemptActionCallback();
  const analysis = analysisState?.analysis;
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const { url } = useRouteMatch();
  const redirectURL = url.endsWith(studyRecord.id[0].value)
    ? `${url}/new`
    : Path.resolve(url, '../new');
  const history = useHistory();
  const redirectToNewAnalysis = () => history.push(redirectURL);

  const analysisId = getAnalysisId(analysis);

  useEffect(() => {
    setDialogIsOpen(false);
  }, [analysisId]);

  return (
    <>
      <div className={cx('-Heading')}>
        <h1>{safeHtml(studyRecord.displayName)}</h1>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {/* {studyRecord.attributes.bulk_download_url && (
            <div>
              <FloatingButton
                text="Download"
                tooltip="Download study files"
                icon={Download}
                onPress={() => {
                  attemptAction(Action.download, {
                    studyId: studyRecord.id[0].value,
                    onAllow: () => {
                      window.location.href = (studyRecord.attributes
                        .bulk_download_url as LinkAttributeValue).url;
                    },
                  });
                }}
              />
            </div>
          )} */}
          <div>
            <FloatingButton
              themeRole="primary"
              text="New analysis"
              tooltip="Create a new analysis"
              textTransform="capitalize"
              size="medium"
              // @ts-ignore
              icon={AddIcon}
              onPress={
                /** If (1) there is no analysis, (2) we're in an unsaved new
                 * analysis (here `analysis` is still undefined in this case),
                 * or (3) we're in a renamed analysis, just go straight to the
                 * new analysis. Otherwise, show the renaming dialog. */
                analysis && analysis.displayName === DEFAULT_ANALYSIS_NAME
                  ? () => setDialogIsOpen(true)
                  : redirectToNewAnalysis
              }
            />
          </div>
          <div>
            <FloatingButton
              themeRole="primary"
              text="My analyses"
              textTransform="capitalize"
              tooltip="View all your analyses of this study"
              icon={Table}
              onPress={() =>
                history.push(
                  '/eda?s=' + encodeURIComponent(studyRecord.displayName)
                )
              }
            />
          </div>
        </div>
      </div>
      {analysisState && isSavedAnalysis(analysis) && (
        <AnalysisNameDialog
          isOpen={dialogIsOpen}
          setIsOpen={setDialogIsOpen}
          initialAnalysisName={analysis.displayName}
          setAnalysisName={(newName) =>
            newName && analysisState.setName(newName)
          }
          redirectToNewAnalysis={redirectToNewAnalysis}
        />
      )}
    </>
  );
}
