import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Task } from '@veupathdb/wdk-client/lib/Utils/Task';
import { fullScreenAppPlugins } from '.';
import { AnalysisState } from '../../hooks/analysis';
import { useAnalysisClient } from '../../hooks/workspace';
import { isSavedAnalysis } from '../../utils/analysis';

interface Props {
  analysisState: AnalysisState;
  appName: string;
  onClose: () => void;
}
export default function FullScreenContainer(props: Props) {
  const plugin = fullScreenAppPlugins[props.appName];
  const [nodeRef, setNodeRef] = useState<HTMLDivElement>();
  useEffect(() => {
    if (plugin == null) return;
    const div = document.createElement('div');
    document.body.appendChild(div);
    const currentStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setNodeRef(div);
    return function cleanup() {
      document.body.removeChild(div);
      document.body.style.overflow = currentStyle;
    };
  }, [plugin]);
  const { loading, appState, updateAppState } = useAppState(
    isSavedAnalysis(props.analysisState.analysis)
      ? props.analysisState.analysis.analysisId
      : undefined,
    props.appName
  );
  if (plugin == null) return <div>Unknown plugin</div>;
  // TODO Track if app state is being loaded and show a spinner if it is to prevent rendering with default app state at first
  return nodeRef
    ? createPortal(
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            background: 'white',
          }}
        >
          <button
            type="button"
            style={{
              position: 'absolute',
              zIndex: 2,
              right: 8,
              top: 8,
              fontSize: '3em',
              background: 'none',
              border: '0',
            }}
            onClick={props.onClose}
          >
            &times;
          </button>
          <div
            style={{
              position: 'absolute',
              zIndex: 1,
              height: '100%',
              width: '100%',
            }}
          >
            {loading ? null : (
              <plugin.fullScreenComponent
                appState={appState}
                persistAppState={updateAppState}
                analysisState={props.analysisState}
              />
            )}
          </div>
        </div>,
        nodeRef
      )
    : null;
}

function useAppState(analysisId: string | undefined, appName: string) {
  // This code is a little naive and lacks safeguards against
  // race conditions, throttling requests, etc.
  const analysisClient = useAnalysisClient();
  const [appState, setAppState] = useState<unknown>();
  const [loading, setLoading] = useState(false);
  const key = analysisId && `fullScreenApp/${analysisId}/${appName}`;

  useEffect(() => {
    if (key == null) return;
    setLoading(true);
    return Task.fromPromise(() => analysisClient.getPreferences())
      .map((preferences) => preferences[key])
      .run((appState) => {
        setAppState(appState);
        setLoading(false);
      });
  }, [analysisClient, key]);

  const updateAppState = useCallback(
    (state: unknown) => {
      setAppState(state);
      if (key == null) return;
      analysisClient.setPreferences({
        [key]: state,
      });
    },
    [analysisClient, key]
  );

  return { loading, appState, updateAppState };
}
