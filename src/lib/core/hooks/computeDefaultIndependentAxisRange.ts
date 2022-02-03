import { useMemo, useRef, useLayoutEffect } from 'react';
import { DateVariable, NumberVariable, Variable } from '../types/study';
import { NumberOrDateRange } from '@veupathdb/components/lib/types/general';
import { HistogramConfig } from '../components/visualizations/implementations/HistogramVisualization';
// adding margin for scatter plot range
import { axisRangeMargin } from '../utils/axis-range-margin';

export function defaultIndependentAxisRangeFunction(
  variable: Variable | undefined,
  plotName: string
): NumberOrDateRange | undefined {
  // make universal range variable
  if (variable != null) {
    if (NumberVariable.is(variable)) {
      return variable.displayRangeMin != null &&
        variable.displayRangeMax != null
        ? {
            min: Math.min(variable.displayRangeMin, variable.rangeMin),
            max: Math.max(variable.displayRangeMax, variable.rangeMax),
          }
        : {
            // separate histogram following the criterion at histogram filter
            min:
              plotName === 'histogram'
                ? Math.min(0, variable.rangeMin)
                : variable.rangeMin,
            max: variable.rangeMax,
          };
    } else if (DateVariable.is(variable)) {
      return variable.displayRangeMin != null &&
        variable.displayRangeMax != null
        ? {
            min:
              [variable.displayRangeMin, variable.rangeMin].reduce(function (
                a,
                b
              ) {
                return a < b ? a : b;
              }) + 'T00:00:00Z',
            max:
              [variable.displayRangeMax, variable.rangeMax].reduce(function (
                a,
                b
              ) {
                return a > b ? a : b;
              }) + 'T00:00:00Z',
          }
        : {
            min: variable.rangeMin + 'T00:00:00Z',
            max: variable.rangeMax + 'T00:00:00Z',
          };
    }
  } else return undefined;
}

export function useDefaultIndependentAxisRange(
  variable: Variable | undefined,
  plotName: string,
  updateVizConfig: (newConfig: Partial<HistogramConfig>) => void
): NumberOrDateRange | undefined {
  // consider both histogram and scatterplot at once
  const defaultIndependentAxisRange:
    | NumberOrDateRange
    | undefined = useMemo(() => {
    const defaultIndependentRange = defaultIndependentAxisRangeFunction(
      variable,
      plotName
    );
    return plotName === 'scatterplot'
      ? axisRangeMargin(defaultIndependentRange, variable?.type)
      : defaultIndependentRange;
  }, [variable, plotName]);

  // use this to avoid infinite loop: also use useLayoutEffect to avoid async/ghost issue
  const updateVizConfigRefInd = useRef(updateVizConfig);
  useLayoutEffect(() => {
    updateVizConfigRefInd.current = updateVizConfig;
  }, [updateVizConfig]);

  // update vizConfig.dependentAxisRange as it is necessary for set range correctly
  useLayoutEffect(() => {
    updateVizConfigRefInd.current({
      independentAxisRange: defaultIndependentAxisRange,
    });
  }, [defaultIndependentAxisRange]);

  return defaultIndependentAxisRange;
}
