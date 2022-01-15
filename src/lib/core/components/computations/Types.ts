import { string } from 'fp-ts';
import React from 'react';
import { AnalysisState } from '../../hooks/analysis';
import { EntityCounts } from '../../hooks/entityCounts';
import { PromiseHookState } from '../../hooks/promise';
import { Computation, ComputationAppOverview } from '../../types/visualization';
import { VisualizationType } from '../visualizations/VisualizationTypes';

export interface ComputationProps {
  analysisState: AnalysisState;
  computationAppOverview: ComputationAppOverview;
  totalCounts: PromiseHookState<EntityCounts>;
  filteredCounts: PromiseHookState<EntityCounts>;
}

export interface ComputationConfigProps extends ComputationProps {
  addNewComputation: (name: string, configuration: unknown) => void;
}

export interface ComputationOverviewProps extends ComputationProps {}

export interface ComputationInstanceProps extends ComputationProps {
  computation: Computation;
}

export interface ComputationComponents {
  /** Screen that shows details of app and existing instances */
  overview: React.ComponentType<ComputationOverviewProps>;
  /** Screen that allows user to configure an app instance */
  create: React.ComponentType<ComputationOverviewProps>;
  /** Screen that allow user to update configuration of an app instance */
  edit: React.ComponentType<ComputationInstanceProps>;
  /** Screen that allows user to add visuzliations to an app instance */
  instance: React.ComponentType<ComputationInstanceProps>;
}

export interface ComputationPlugin {
  configurationComponent: React.ComponentType<ComputationConfigProps>;
  visualizationTypes: Record<string, VisualizationType>;
}
