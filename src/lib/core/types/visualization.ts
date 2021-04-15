/* eslint-disable @typescript-eslint/no-redeclare */
import {
  TypeOf,
  type,
  string,
  unknown,
  partial,
  intersection,
  boolean,
  number,
  array,
  record,
} from 'io-ts';
import { StudyVariableDataShape, StudyVariableType } from './study';

/**
 * Visualization object stored in user's session
 */
export type Visualization = TypeOf<typeof Visualization>;
export const Visualization = type({
  id: string,
  computationId: string,
  type: string,
  displayName: string,
  configuration: unknown,
});

/**
 * App object stored in user's session
 */
export type Computation = TypeOf<typeof Computation>;
export const Computation = type({
  id: string,
  type: string,
  displayName: string,
  configuration: unknown,
});

const Thing = partial({
  name: string,
  displayName: string,
  description: string,
});

export type DataElementConstraint = TypeOf<typeof DataElementConstraint>;
export const DataElementConstraint = intersection([
  type({
    isRequired: boolean,
    minNumVars: number,
    maxNumVars: number,
  }),
  partial({
    allowedTypes: array(StudyVariableType),
    allowedShapes: array(StudyVariableDataShape),
  }),
]);

export type VisualizationOverview = TypeOf<typeof VisualizationOverview>;
export const VisualizationOverview = intersection([
  Thing,
  partial({
    dataElementConstraints: array(record(string, DataElementConstraint)),
    dataElementDependencyOrder: array(string),
  }),
]);

export type ComputationAppOverview = TypeOf<typeof ComputationAppOverview>;
export const ComputationAppOverview = intersection([
  Thing,
  partial({
    visualizations: array(VisualizationOverview),
  }),
]);
