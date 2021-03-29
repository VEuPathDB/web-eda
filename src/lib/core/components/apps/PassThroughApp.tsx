import React, { useCallback, useMemo } from 'react';
import { useSession } from '../../hooks/session';
import { Visualization } from '../../types/visualization';
import { testVisualization } from '../visualizations/implementations/TestVisualization';
import { VisualizationsContainer } from '../visualizations/VisualizationsContainer';
import { VisualizationType } from '../visualizations/VisualizationTypes';

interface Props {
  sessionId: string;
}

const visualizationTypes: VisualizationType[] = [testVisualization];

export function PassThroughApp(props: Props) {
  const { sessionId } = props;
  const { session, setVisualizations } = useSession(sessionId);
  const addVisualization = useCallback(
    (visualization: Visualization) => {
      setVisualizations([...(session?.visualizations ?? []), visualization]);
    },
    [setVisualizations, session]
  );
  const updateVisualization = useCallback(
    (visualization: Visualization) => {
      setVisualizations([
        ...(session?.visualizations.filter(
          (viz) => viz.id !== visualization.id
        ) ?? []),
        visualization,
      ]);
    },
    [setVisualizations, session]
  );

  const filters = useMemo(() => session?.filters ?? [], [session?.filters]);
  if (session == null) return <div>Session not found</div>;
  return (
    <VisualizationsContainer
      appId="pass-through"
      apps={[
        {
          id: 'pass-through',
          type: 'pass',
          configuration: undefined,
        },
      ]}
      visualizations={session.visualizations}
      addVisualization={addVisualization}
      updateVisualization={updateVisualization}
      visualizationTypes={visualizationTypes}
      filters={filters}
    />
  );
}
