import { Filter } from '../../types/filter';
import {
  Computation,
  DataElementConstraint,
  Visualization,
} from '../../types/visualization';

/**
 * Props passed to viz components
 */
export interface VisualizationProps {
  visualization: Visualization;
  dataElementConstraints?: Record<string, DataElementConstraint>[];
  dataElementDependencyOrder?: string[];
  updateVisualization?: (newViz: Visualization) => void;
  computation: Computation;
  filters: Filter[];
}

export interface VisualizationType {
  gridComponent: React.ComponentType<VisualizationProps>;
  fullscreenComponent: React.ComponentType<VisualizationProps>;
  selectorComponent: React.ComponentType;
  createDefaultConfig: () => unknown;
}
