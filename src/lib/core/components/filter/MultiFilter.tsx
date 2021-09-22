import { orderBy } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Loading } from '@veupathdb/wdk-client/lib/Components';
import MultiFieldFilter from '@veupathdb/wdk-client/lib/Components/AttributeFilter/MultiFieldFilter';
import {
  FieldTreeNode,
  Filter as WdkFilter,
} from '@veupathdb/wdk-client/lib/Components/AttributeFilter/Types';

import { AnalysisState } from '../../hooks/analysis';
import { usePromise } from '../../hooks/promise';
import { useSubsettingClient } from '../../hooks/workspace';
import { MultiFilter as MultiFilterType } from '../../types/filter';
import {
  MultiFilterVariable,
  StudyEntity,
  StudyMetadata,
} from '../../types/study';
import {
  entitiesToFields,
  fromEdaFilter,
  makeFieldTree,
  toEdaFilter,
} from '../../utils/wdk-filter-param-adapter';
import { getDistribution } from './util';
import { preorderSeq } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import {
  isFilterField,
  isMulti,
} from '@veupathdb/wdk-client/lib/Components/AttributeFilter/AttributeFilterUtils';
import { gray, red } from './colors';

export interface Props {
  analysisState: AnalysisState;
  studyMetadata: StudyMetadata;
  variable: MultiFilterVariable;
  entity: StudyEntity;
  totalEntityCount: number;
  filteredEntityCount: number;
}

export function MultiFilter(props: Props) {
  const {
    studyMetadata,
    variable,
    entity,
    totalEntityCount,
    filteredEntityCount,
    analysisState,
  } = props;
  // Gather props for MultiFieldFilter:
  // - displayName: string
  // - dataCount: number
  // - filteredDataCount: number
  // - filters: Filter[]
  // - activeField: object
  // - activeFieldState: {
  //     loading: boolean,
  //     summary: FieldSummary,
  //     leafSummaries; MultiFieldSummary[]
  //   }
  // - onFiltersChange
  // - onMemberSort
  // - onMemberSearch
  // - onRangeScaleChange
  // - hideFieldPanel
  // - selectByDefault

  // Create WDK Fields
  const fields = useMemo(
    () =>
      // This function uses {entity.id}/{variable.id} to generate a field's term
      // and parent property value. That is not desired here, so we have to do
      // some post-processing to use {variable.id} for those properties.
      entitiesToFields([entity], { includeMultiFilters: true })
        .filter((field) => !field.term.startsWith('entity:'))
        .map((field) => ({
          ...field,
          term: field.term.split('/')[1],
          parent: field.parent?.startsWith('entity:')
            ? undefined
            : field.parent?.split('/')[1],
        })),
    [entity]
  );

  // Create a WDK FieldTree
  const fieldTree = useMemo(() => makeFieldTree(fields), [fields]);

  // Find active field
  const activeFieldNode: FieldTreeNode | undefined = preorderSeq(
    fieldTree
  ).find((node) => node.field.term === variable.id);
  if (activeFieldNode == null) throw new Error('Could not find active field');
  const activeField = activeFieldNode?.field;

  // Find leaves
  const leaves = useMemo(
    () =>
      preorderSeq(activeFieldNode)
        .filter((node) => isFilterField(node.field) && !isMulti(node.field))
        .map((node) => node.field)
        .toArray(),
    [activeFieldNode]
  );

  const [sort, setSort] = useState<{
    columnKey: string;
    direction: 'asc' | 'desc';
  }>({
    columnKey: 'display',
    direction: 'asc',
  });

  const [searchTerm, setSearchTerm] = useState('');

  const onMemberSort = useCallback((_, sort) => {
    setSort(sort);
  }, []);

  const onMemberSearch = useCallback((_, searchTerm: string) => {
    setSearchTerm(searchTerm);
  }, []);

  const subsettingClient = useSubsettingClient();

  // Counts are only updated for this variable under two conditions:
  // 1. Filters for other variables are changed
  // 2. Subfilters for this variable are changed AND operation is intersect
  //
  // This is managed by holding the filter for this variable in a state variable.
  // Users can demand counts be updated by clicking on an "Update counts" button.

  // This value is used to update `countsAreCurrent`, and to update
  // the state variable `thisFilter` when "Update counts" is clicked.
  const _thisFilter = findThisFilter(analysisState, entity, variable);

  // Filter assocated with this variable. This is used to retreive counts.
  // We're using state so that we can defer updating counts until the user
  // clicks on an "update counts" button.
  const [thisFilter, setThisFilter] = useState<MultiFilterType | undefined>(
    _thisFilter
  );

  const filters = analysisState.analysis?.descriptor.subset.descriptor;

  // Use a JSON string here so that we don't udpate counts for every render.
  // array.filter will always return a _new_ array, but strings are immutable,
  // so this trick will cause same-valued arrays to be referentially equal.
  const otherFiltersJson = useMemo(
    () =>
      JSON.stringify(
        filters?.filter(
          (filter) =>
            !(
              filter.entityId === entity.id && filter.variableId === variable.id
            )
        )
      ),
    [filters, entity.id, variable.id]
  );

  // State used to control if the "Update counts" button is disabled.
  const [countsAreCurrent, setCountsAreCurrent] = useState(true);

  useEffect(() => {
    setCountsAreCurrent(_thisFilter === thisFilter);
  }, [_thisFilter, thisFilter]);

  // Counts retrieved from the backend, used for the table display.
  const leafSummariesPromise = usePromise(
    useCallback(() => {
      const otherFilters = JSON.parse(otherFiltersJson);
      return Promise.all(
        leaves.map((leaf) => {
          const thisFilterWithoutLeaf = thisFilter && {
            ...thisFilter,
            subFilters: thisFilter.subFilters.filter(
              (f) => f.variableId !== leaf.term
            ),
          };
          return getDistribution(
            {
              entityId: entity.id,
              variableId: leaf.term,
              filters:
                thisFilterWithoutLeaf == null ||
                thisFilterWithoutLeaf.subFilters.length === 0 ||
                thisFilterWithoutLeaf.operation === 'union'
                  ? otherFilters
                  : [...(otherFilters || []), thisFilterWithoutLeaf],
            },
            (filters) =>
              subsettingClient.getDistribution(
                studyMetadata.id,
                entity.id,
                leaf.term,
                {
                  filters,
                  valueSpec: 'count',
                }
              )
          ).then((distribution) => {
            const fgValueByLabel = Object.fromEntries(
              distribution.foreground.histogram.map(({ binLabel, value }) => [
                binLabel,
                value ?? 0,
              ])
            );
            const bgValueByLabel = Object.fromEntries(
              distribution.background.histogram.map(({ binLabel, value }) => [
                binLabel,
                value ?? 0,
              ])
            );
            return {
              term: leaf.term,
              display: leaf.display,
              valueCounts: Object.keys(bgValueByLabel).map((label) => ({
                value: label,
                count: bgValueByLabel[label],
                filteredCount: fgValueByLabel[label] ?? 0,
              })),
              internalsCount:
                distribution.background.statistics.numDistinctEntityRecords,
              internalsFilteredCount:
                distribution.foreground.statistics.numDistinctEntityRecords,
            };
          });
        })
      );
    }, [
      thisFilter,
      otherFiltersJson,
      leaves,
      entity.id,
      subsettingClient,
      studyMetadata.id,
    ])
  );

  // Sorted counts. This is done separately from retrieving the data so that
  // updates to sorting don't incur backend requests.
  const orderedLeafSummaries = useMemo(
    () =>
      orderBy(
        leafSummariesPromise.value,
        [
          (summary) => {
            switch (sort.columnKey) {
              case 'filteredCount':
                return summary.internalsFilteredCount;
              case 'count':
                return summary.internalsCount;
              default:
                return summary.display;
            }
          },
        ],
        [sort.direction]
      ),
    [leafSummariesPromise.value, sort.columnKey, sort.direction]
  );

  // Update analysis filter - need to convert from WDK to EDA filter.
  const handleFiltereChange = useCallback(
    (nextFilters: WdkFilter[]) => {
      const edaFilters = nextFilters
        // this is needed because MultiFieldFilter will create subFilters with an
        // empty set of values, which does not work w/ eda
        .filter(
          (filter) =>
            filter.type !== 'multiFilter' ||
            filter.value.filters.every(
              (subFilter) => subFilter.value.length > 0
            )
        )
        .map((filter) => toEdaFilter(filter, entity.id));
      analysisState.setFilters(edaFilters);
    },
    [analysisState, entity.id]
  );

  // Compose activeFieldState, used by MultiFieldFilter
  const activeFieldState = useMemo(
    () => ({
      invalid: leafSummariesPromise.error != null,
      loading: leafSummariesPromise.pending,
      leafSummaries: orderedLeafSummaries,
      searchTerm,
      sort,
    }),
    [
      leafSummariesPromise.error,
      leafSummariesPromise.pending,
      orderedLeafSummaries,
      searchTerm,
      sort,
    ]
  );

  // Convert EDA filters to WDK filters.
  const wdkFilters = useMemo(() => filters?.map(fromEdaFilter), [filters]);

  // Prevent table from displaying "no data" message
  if (leafSummariesPromise.pending && leafSummariesPromise.value == null)
    return <Loading>Loading data...</Loading>;

  // Show error to user
  if (leafSummariesPromise.error)
    return <div>{String(leafSummariesPromise.error)}</div>;

  return (
    <div className="filter-param" style={{ position: 'relative' }}>
      {leafSummariesPromise.pending && (
        <Loading style={{ position: 'absolute', right: 0, left: 0, top: 0 }} />
      )}
      <button
        className="btn"
        type="button"
        disabled={countsAreCurrent}
        onClick={() => {
          setThisFilter(_thisFilter);
        }}
      >
        Update counts
      </button>
      <MultiFieldFilter
        displayName={entity.displayNamePlural}
        dataCount={totalEntityCount}
        filteredDataCount={filteredEntityCount}
        filters={wdkFilters}
        activeField={activeField}
        activeFieldState={activeFieldState}
        fieldTree={fieldTree}
        onFiltersChange={handleFiltereChange}
        onMemberSort={onMemberSort}
        onMemberSearch={onMemberSearch}
        fillBarColor={gray}
        fillFilteredBarColor={red}
      />
    </div>
  );
}

/**
 * Helper function to find the filter associated with an entity/variable
 * @param analysisState
 * @param entity
 * @param variable
 */
function findThisFilter(
  analysisState: AnalysisState,
  entity: StudyEntity,
  variable: { id: string; providerLabel: string; displayName: string } & {
    parentId?: string | undefined;
    definition?: string | undefined;
    displayOrder?: number | undefined;
    displayType?: 'default' | 'multifilter' | 'hidden' | undefined;
    dataShape?: 'categorical' | 'ordinal' | 'binary' | 'continuous' | undefined;
  } & { type: 'category'; displayType: 'multifilter' }
):
  | ({ entityId: string; variableId: string } & {
      type: 'multiFilter';
      operation: 'union' | 'intersect';
      subFilters: { variableId: string; stringSet: string[] }[];
    })
  | (() =>
      | ({ entityId: string; variableId: string } & {
          type: 'multiFilter';
          operation: 'union' | 'intersect';
          subFilters: { variableId: string; stringSet: string[] }[];
        })
      | undefined)
  | undefined {
  return analysisState.analysis?.descriptor.subset.descriptor.find(
    (filter): filter is MultiFilterType =>
      filter.entityId === entity.id &&
      filter.variableId === variable.id &&
      filter.type === 'multiFilter'
  );
}
