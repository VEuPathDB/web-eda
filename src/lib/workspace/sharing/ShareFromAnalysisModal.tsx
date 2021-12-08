import UIModal from '@veupathdb/core-components/dist/components/modals/UIModal';
import { useWdkService } from '@veupathdb/wdk-client/lib/Hooks/WdkServiceHook';

import NameAnalysis from './NameAnalysis';
import Login from './Login';
import ConfirmPublicAnalysis from './ConfirmPublicAnalysis';
import { AnalysisState } from '../../core';

type ShareFromAnalyisModalProps = {
  visible: boolean;
  toggleVisible: (visible: boolean) => void;
  analysisState: AnalysisState;
};

export default function ShareFromAnalyisModal({
  visible,
  toggleVisible,
  analysisState,
}: ShareFromAnalyisModalProps) {
  const userLoggedIn = useWdkService((wdkService) =>
    wdkService.getCurrentUser().then((user) => !user.isGuest)
  );

  return (
    <UIModal
      title="Make Analysis Public"
      visible={visible}
      toggleVisible={toggleVisible}
      includeCloseButton={true}
      themeRole="primary"
      styleOverrides={{ size: { width: 700, height: 500 } }}
    >
      {!userLoggedIn ? (
        <Login toggleVisible={toggleVisible} />
      ) : analysisState.analysis?.displayName === 'Unnamed Analysis' ? (
        <NameAnalysis
          currentName={analysisState.analysis.displayName}
          updateName={analysisState.setName}
        />
      ) : (
        <ConfirmPublicAnalysis
          makeAnalysisPublic={() => analysisState.setIsPublic(true)}
          toggleVisible={toggleVisible}
        />
      )}
    </UIModal>
  );
}