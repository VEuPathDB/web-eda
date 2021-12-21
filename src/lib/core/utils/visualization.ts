import {
  HistogramData,
  BarplotData,
  BoxplotData,
  FacetedData,
} from '@veupathdb/components/lib/types/plots';
import { StudyEntity, Variable } from '../types/study';
import { CoverageStatistics } from '../types/visualization';
import { isFaceted } from '@veupathdb/components/lib/types/guards';
import { EntityCounts } from '../hooks/entityCounts';
import { CompleteCasesTable } from '../api/DataClient';
import { Bounds } from '@veupathdb/components/lib/map/Types';
import { Filter } from '../types/filter';
import { VariableDescriptor } from '../types/variable';

// was: BarplotData | HistogramData | { series: BoxplotData };
type SeriesWithStatistics<T> = T & CoverageStatistics;
type MaybeFacetedSeries<T> = T | FacetedData<T>;
type MaybeFacetedSeriesWithStatistics<T> = MaybeFacetedSeries<T> &
  CoverageStatistics;

export function grayOutLastSeries<
  T extends { series: BoxplotData } | BarplotData | HistogramData
>(
  data: T | MaybeFacetedSeriesWithStatistics<T>,
  showMissingness: boolean = false,
  borderColor: string | undefined = undefined
): MaybeFacetedSeriesWithStatistics<T> {
  if (isFaceted(data)) {
    return {
      ...data,
      facets: data.facets.map(({ label, data }) => ({
        label,
        data:
          data != null
            ? (grayOutLastSeries(data, showMissingness, borderColor) as T)
            : undefined,
      })),
    };
  }

  return {
    ...data,
    series: data.series.map((series, index) =>
      showMissingness && index === data.series.length - 1
        ? {
            ...series,
            color: '#e8e8e8',
            outlierSymbol: 'x',
            borderColor,
          }
        : series
    ),
  } as SeriesWithStatistics<T>;
}

/**
 * Calculates if there are any incomplete cases for the given variable
 * (usually overlay or facet variable)
 */
export function hasIncompleteCases(
  entity: StudyEntity | undefined,
  variable: Variable | undefined,
  outputEntity: StudyEntity | undefined,
  filteredCounts: EntityCounts,
  completeCasesTable: CompleteCasesTable
): boolean {
  const completeCases =
    entity != null && variable != null
      ? completeCasesTable.find(
          (row) =>
            row.variableDetails?.entityId === entity.id &&
            row.variableDetails?.variableId === variable.id
        )?.completeCases
      : undefined;
  return (
    outputEntity != null &&
    completeCases != null &&
    completeCases < filteredCounts[outputEntity.id]
  );
}

/**
 * Convert pvalue number into '< 0.001' or '< 0.01' or single digit precision string.
 *
 * If provided a string, just return the string, no questions asked.
 *
 */
export function quantizePvalue(pvalue: number | string): string {
  if (typeof pvalue === 'string') {
    return pvalue;
  } else if (pvalue < 0.001) {
    return '< 0.001';
  } else if (pvalue < 0.01) {
    return '< 0.01';
  } else {
    return pvalue.toPrecision(1);
  }
}

/**
 * See web-eda issue 508
 *
 * Number variable values come from back end as strings when used as labels;
 * converting through number solves the problem in
 * issue 508 where "40.0" from back end doesn't match variable vocabulary's "40"
 *
 */
export function fixLabelsForNumberVariables(
  labels: string[] = [],
  variable?: Variable
): string[] {
  return variable != null && variable.type === 'number'
    ? labels.map((n) => String(Number(n)))
    : labels;
}

/**
 * non-array version of fixLabelsForNumberVariables
 *
 * However, unlike fixLabelsForNumberVariables it will pass through any non-number strings.
 * This is because this is used to clean up overlayVariable values, which can be 'No data'
 */
export function fixLabelForNumberVariables(
  label: string,
  variable?: Variable
): string {
  return variable != null && variable.type === 'number'
    ? String(isNaN(Number(label)) ? label : Number(label))
    : label;
}

export const nonUniqueWarning =
  'Variables must be unique. Please choose different variables.';

export function vocabularyWithMissingData(
  vocabulary: string[] = [],
  includeMissingData: boolean = false
): string[] {
  return includeMissingData && vocabulary.length
    ? [...vocabulary, 'No data']
    : vocabulary;
}

export function variablesAreUnique(vars: (Variable | undefined)[]): boolean {
  const defined = vars.filter((item) => item != null);
  const unique = defined.filter((item, i, ar) => ar.indexOf(item) === i);
  return defined.length === unique.length;
}

/**
 * convert viewport bounding box into two EDA filters
 *
 * @param bounds : Bounds
 * @param latitudeVariableDetails : { entityId: string, variableId: string }
 * @param longitudeVariableDetails : { entityId: string, variableId: string }
 *
 * @return filters : Array<Filter>
 **/

export function filtersFromBoundingBox(
  bounds: Bounds,
  latitudeVariableDetails: VariableDescriptor,
  longitudeVariableDetails: VariableDescriptor
): Filter[] {
  return [
    {
      type: 'numberRange',
      ...latitudeVariableDetails,
      min: bounds.southWest.lat,
      max: bounds.northEast.lat,
    },
    //    {
    //      type: 'longitudeRange',
    //      ...longitudeVariableDetails,
    //      min: bounds.southWest.lng,
    //      max: bounds.northEast.lng,
    //    }
  ];
}
