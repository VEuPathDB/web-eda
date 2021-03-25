/* eslint-disable @typescript-eslint/no-redeclare */
import * as t from 'io-ts';
import { StudyVariable, StudyEntity } from './study';

const _VisualizationConfigBase = t.type({
  visualizationId: t.string,
});

export type HistogramConfig = t.TypeOf<typeof HistogramConfig>;
export const HistogramConfig = t.intersection([
  _VisualizationConfigBase,
  t.type({
    type: t.literal('histogram'),
    enableOverlay: t.boolean,
  }),
  t.partial({
    independentVariable: StudyVariable, // TO DO: make this numeric/date continuous?
    independentVariableEntity: StudyEntity,
    overlayVariable: StudyVariable, // TO DO: make this categorical
    overlayVariableEntity: StudyEntity,
    binWidth: t.number,
    binWidthTimeUnit: t.string, // TO DO: constrain to weeks, months etc like Unit from date-arithmetic and/or R
  }),
]);

// placeholder for further viz types
export type BoxplotConfig = t.TypeOf<typeof BoxplotConfig>;
export const BoxplotConfig = t.intersection([
  _VisualizationConfigBase,
  t.type({
    type: t.literal('boxplot'),
  }),
]);

export type Visualization = t.TypeOf<typeof Visualization>;
export const Visualization = t.union([HistogramConfig, BoxplotConfig]);
