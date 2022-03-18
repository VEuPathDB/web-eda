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
  nullType,
  NullType,
  union,
  NullC,
} from 'io-ts';
import { VariableDataShape, VariableType } from './study';

import { CompleteCasesTable } from '../api/DataClient';
import { Filter } from './filter';
import { VariableDescriptor } from './variable';

/**
 * Metadata for the visualization object stored in user's analysis
 */
export type VisualizationDescriptor = TypeOf<typeof VisualizationDescriptor>;
export const VisualizationDescriptor = intersection([
  type({
    type: string,
    configuration: unknown,
  }),
  partial({
    thumbnail: string,
    // new props to store filters at fullscreen mode
    currentPlotFilters: array(Filter),
  }),
]);

/**
 * Visualization object stored in user's analysis
 */
export type Visualization = TypeOf<typeof Visualization>;
export const Visualization = intersection([
  type({
    visualizationId: string,
    descriptor: VisualizationDescriptor,
  }),
  partial({
    displayName: string,
  }),
]);

/**
 * Type and configuration of the app object stored in user's analysis
 */
// alphadiv abundance
export type ComputationConfiguration = TypeOf<
  typeof ComputationConfiguration | NullType
>;
// export type ComputationConfiguration = TypeOf<typeof ComputationConfiguration>;
export const ComputationConfiguration = intersection([
  type({
    name: string,
    collectionVariable: VariableDescriptor,
  }),
  partial({
    alphaDivMethod: string,
    rankingMethod: string,
  }),
]);

// alphadiv abundance
export type ComputationDescriptor = TypeOf<typeof ComputationDescriptor>;
export const ComputationDescriptor = type({
  type: string,
  // using ComputationConfiguration here cannot handle null case correctly that causes issues for pass-through app
  // thus it is reverted to unknown for now
  // configuration: ComputationConfiguration,
  configuration: unknown,
});

/**
 * App object stored in user's analysis
 */
export type Computation = TypeOf<typeof Computation>;
export const Computation = intersection([
  type({
    computationId: string,
    descriptor: ComputationDescriptor,
    visualizations: array(Visualization),
  }),
  partial({
    displayName: string,
  }),
]);

const Thing = intersection([
  type({
    name: string,
    displayName: string,
  }),
  partial({
    description: string,
  }),
]);

export type DataElementConstraint = TypeOf<typeof DataElementConstraint>;
export const DataElementConstraint = intersection([
  type({
    isRequired: boolean,
    minNumVars: number,
    maxNumVars: number,
  }),
  partial({
    isTemporal: boolean,
    allowedTypes: array(VariableType),
    allowedShapes: array(VariableDataShape),
    maxNumValues: number,
    allowMultiValued: boolean,
    // description isn't yet present for the records visualization
    description: string,
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
    projects: array(string),
  }),
]);

export type CoverageStatistics = {
  completeCases: CompleteCasesTable;
  completeCasesAllVars: number;
  completeCasesAxesVars: number;
};
