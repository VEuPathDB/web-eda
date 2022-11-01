import { useCallback, useMemo } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useToggleStarredVariable } from '../../hooks/starredVariables';
import { Computation, Visualization } from '../../types/visualization';
import { VisualizationsContainer } from '../visualizations/VisualizationsContainer';
import { ComputationProps } from './Types';
import { plugins } from './plugins';
import { VisualizationPlugin } from '../visualizations/VisualizationPlugin';
import { useStudyMetadata } from '../../hooks/workspace';
import { AnalysisState } from '../../hooks/analysis';

export interface Props extends ComputationProps {
  computationId: string;
  visualizationPlugins: Partial<Record<string, VisualizationPlugin>>;
  baseUrl?: string; // right now only defined when *not* using single app mode
  isSingleAppMode: boolean;
}

export function ComputationInstance(props: Props) {
  const {
    computationAppOverview,
    computationId,
    analysisState,
    totalCounts,
    filteredCounts,
    geoConfigs,
    visualizationPlugins,
    baseUrl,
    isSingleAppMode,
  } = props;

  const { analysis, setComputations } = analysisState;

  const computation = useComputation(analysis, computationId);

  const toggleStarredVariable = useToggleStarredVariable(props.analysisState);

  const updateVisualizations = useCallback(
    (
      visualizations:
        | Visualization[]
        | ((visualizations: Visualization[]) => Visualization[])
    ) => {
      setComputations((computations) =>
        computations.map((computation) => {
          if (computation.computationId !== computationId) return computation;
          return {
            ...computation,
            visualizations:
              typeof visualizations === 'function'
                ? visualizations(computation.visualizations)
                : visualizations,
          };
        })
      );
    },
    [setComputations, computationId]
  );

  const { url } = useRouteMatch();

  if (
    analysis == null ||
    computation == null ||
    computationAppOverview.visualizations == null
  )
    return null;

  // If we can have multiple app instances, add a title. Otherwise, use
  // the normal VisualizationsContainer.
  return (
    <div>
      {baseUrl && (
        <AppTitle
          computation={computation}
          condensed={
            url.replace(/\/+$/, '').split('/').pop() === 'visualizations'
          }
        />
      )}
      <VisualizationsContainer
        analysisState={analysisState}
        computationAppOverview={computationAppOverview}
        geoConfigs={geoConfigs}
        computation={computation}
        visualizationsOverview={computationAppOverview.visualizations}
        visualizationPlugins={visualizationPlugins}
        updateVisualizations={updateVisualizations}
        filters={analysis.descriptor.subset.descriptor}
        starredVariables={analysis?.descriptor.starredVariables}
        toggleStarredVariable={toggleStarredVariable}
        totalCounts={totalCounts}
        filteredCounts={filteredCounts}
        baseUrl={baseUrl}
        isSingleAppMode={isSingleAppMode}
      />
    </div>
  );
}

// Title above each app in /visualizations
interface AppTitleProps {
  computation: Computation;
  condensed: boolean;
}

function AppTitle(props: AppTitleProps) {
  const { computation, condensed } = props;
  const plugin = plugins[computation.descriptor?.type];
  const ConfigDescription = plugin
    ? plugin.configurationDescriptionComponent
    : undefined;
  const { configuration } = computation.descriptor;

  return condensed ? (
    <div style={{ lineHeight: 1.5 }}>
      {plugin && configuration
        ? ConfigDescription && <ConfigDescription computation={computation} />
        : null}
    </div>
  ) : null;
}

function useComputation(
  analysis: AnalysisState['analysis'],
  computationId: string
) {
  const studyMetadata = useStudyMetadata();
  return useMemo(() => {
    const computation = analysis?.descriptor.computations.find(
      (computation) => computation.computationId === computationId
    );
    if (computation == null) return;
    const computePlugin = plugins[computation.descriptor.type];
    if (computePlugin == null) {
      throw new Error(
        `Unknown computation type: ${computation.descriptor.type}.`
      );
    }

    if (
      !computePlugin.isConfigurationValid(computation.descriptor.configuration)
    ) {
      return {
        ...computation,
        descriptor: {
          ...computation.descriptor,
          configuration: computePlugin.createDefaultConfiguration(
            studyMetadata.rootEntity
          ),
        },
      };
    }
    return computation;
  }, [
    analysis?.descriptor.computations,
    computationId,
    studyMetadata.rootEntity,
  ]);
}
