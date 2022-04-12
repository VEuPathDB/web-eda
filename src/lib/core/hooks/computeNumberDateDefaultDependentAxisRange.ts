import { useMemo } from 'react';
import { PromiseHookState } from './promise';
import { ScatterPlotDataWithCoverage } from '../components/visualizations/implementations/ScatterplotVisualization';
import { Variable } from '../types/study';
// for scatter plot
import { numberDateDefaultDependentAxisRange } from '../utils/default-dependent-axis-range';
import { axisRangeMargin } from '../utils/axis-range-margin';
import { NumberOrDateRange } from '../types/general';
//DKDK
import { isFaceted } from '@veupathdb/components/lib/types/guards';

/**
 * A custom hook to compute default dependent axis range
 */

export function useDefaultDependentAxisRange(
  data: PromiseHookState<ScatterPlotDataWithCoverage | undefined>,
  yAxisVariable?: Variable
): NumberOrDateRange | undefined {
  // find max of stacked array, especially with overlayVariable
  const defaultDependentAxisRange = useMemo(() => {
    // explicitly check empty data
    if (
      (!isFaceted(data?.value?.dataSetProcess) &&
        data?.value?.dataSetProcess.series == null) ||
      (isFaceted(data?.value?.dataSetProcess) &&
        data?.value?.dataSetProcess?.facets?.length === 0)
    ) {
      return undefined;
    }

    // set yMinMaxRange using yMin/yMax obtained from processInputData()
    const yMinMaxRange =
      data.value != null
        ? { min: data.value.yMin, max: data.value?.yMax }
        : undefined;

    // check whether yAxisVariable.type and yMinMaxRange values match each other: checking string for date type would be sufficient
    if (
      ((yAxisVariable?.type === 'number' ||
        yAxisVariable?.type === 'integer') &&
        typeof yMinMaxRange?.min === 'number' &&
        typeof yMinMaxRange?.max === 'number') ||
      (yAxisVariable?.type === 'date' &&
        typeof yMinMaxRange?.min === 'string' &&
        typeof yMinMaxRange?.max === 'string')
    ) {
      const defaultDependentRange = numberDateDefaultDependentAxisRange(
        yAxisVariable,
        'scatterplot',
        yMinMaxRange
      );
      return axisRangeMargin(defaultDependentRange, yAxisVariable?.type);
    } else {
      return undefined;
    }
  }, [data, yAxisVariable]);

  return defaultDependentAxisRange;
}
