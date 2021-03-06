import { Loading } from '@veupathdb/wdk-client/lib/Components';
import MembershipField from '@veupathdb/wdk-client/lib/Components/AttributeFilter/MembershipField';
import { MultiFieldSortSpec } from '@veupathdb/wdk-client/lib/Views/Question/Params/FilterParamNew/State';
import { getOrElse } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { boolean, keyof, number, string, type, TypeOf } from 'io-ts';
import { zip } from 'lodash';
import { useCallback, useMemo } from 'react';
import { BarplotResponse } from '../../api/data-api';
import { usePromise } from '../../hooks/promise';
import { SessionState } from '../../hooks/session';
import { useDataClient } from '../../hooks/workspace';
import { Filter } from '../../types/filter';
import { StudyEntity, StudyMetadata } from '../../types/study';
import { fromEdaFilter } from '../../utils/wdk-filter-param-adapter';
import { TableVariable } from './types';
import { getDistribution } from './util';

type Props = {
  studyMetadata: StudyMetadata;
  variable: TableVariable;
  entity: StudyEntity;
  sessionState: SessionState;
  totalEntityCount: number;
  filteredEntityCount: number;
};

// `io-ts` decoder to validate the stored ui state for this variable.
// If this validation fails, we will fallback to a default value.
// This means that if this type changes, users will lose their settings,
// which is better than complete failure.
const UIState = type({
  sort: type({
    columnKey: keyof({
      value: null,
      count: null,
      filteredCount: null,
    }),
    direction: keyof({
      asc: null,
      desc: null,
    }),
    groupBySelected: boolean,
  }),
  searchTerm: string,
  currentPage: number,
});

export function TableFilter({
  studyMetadata,
  variable,
  entity,
  sessionState,
  totalEntityCount,
  filteredEntityCount,
}: Props) {
  const dataClient = useDataClient();
  const tableSummary = usePromise(
    useCallback(async () => {
      const distribution = await getDistribution<BarplotResponse>(
        {
          entityId: entity.id,
          variableId: variable.id,
          filters: sessionState.session?.filters,
        },
        (filters) => {
          return dataClient.getBarplot({
            studyId: studyMetadata.id,
            filters,
            config: {
              outputEntityId: entity.id,
              valueSpec: 'count',
              xAxisVariable: {
                entityId: entity.id,
                variableId: variable.id,
              },
            },
          });
        }
      );
      return {
        // first two are used to make sure we're showing the correct distrubution
        entityId: entity.id,
        variableId: variable.id,
        distribution: zip(
          distribution.foreground.data,
          distribution.background.data
        ).map(([fgEntry, bgEntry]) => ({
          value: fgEntry?.label || bgEntry?.label || '',
          count: bgEntry?.value || 0,
          filteredCount: fgEntry?.value || 0,
        })),
        entitiesCount:
          totalEntityCount - distribution.background.config.incompleteCases,
        filteredEntitiesCount:
          filteredEntityCount - distribution.foreground.config.incompleteCases,
      };
    }, [
      entity.id,
      variable.id,
      sessionState.session?.filters,
      totalEntityCount,
      filteredEntityCount,
      dataClient,
      studyMetadata.id,
    ])
  );
  const activeField = useMemo(
    () => ({
      display: variable.displayName,
      isRange: false,
      parent: variable.parentId,
      precision: 1,
      term: variable.id,
      type: variable.type,
      variableName: variable.providerLabel,
    }),
    [variable]
  );

  const filter = sessionState.session?.filters.find(
    (f) => f.entityId === entity.id && f.variableId === variable.id
  );

  const uiStateKey = `${entity.id}/${variable.id}`;

  const uiState = useMemo(() => {
    return pipe(
      UIState.decode(sessionState.session?.variableUISettings[uiStateKey]),
      getOrElse(
        (): TypeOf<typeof UIState> => ({
          sort: {
            columnKey: 'value',
            direction: 'asc',
            groupBySelected: false,
          },
          searchTerm: '',
          currentPage: 1, // 1-based index
        })
      )
    );
  }, [sessionState.session?.variableUISettings, uiStateKey]);

  const sortedDistribution = useMemo(() => {
    const values: any[] =
      filter == null
        ? []
        : filter.type === 'stringSet'
        ? filter.stringSet
        : filter.type === 'numberSet'
        ? filter.numberSet
        : filter.type === 'dateSet'
        ? filter.dateSet
        : [];
    const newDist = tableSummary.value?.distribution
      .slice()
      // first sort by value
      .sort((a, b) =>
        uiState.sort.columnKey === 'value'
          ? // Handle strings w/ numbers, case insensitive
            a.value.localeCompare(b.value, 'en', {
              numeric: true,
              sensitivity: 'base',
            })
          : // Otherwise, numeric comparison
            a[uiState.sort.columnKey] - b[uiState.sort.columnKey]
      );
    // Reverse sort, if direction is 'desc'
    if (uiState.sort.direction === 'desc') newDist?.reverse();
    // Finally, stable sort selected values before unselected values
    if (uiState.sort.groupBySelected)
      newDist?.sort((a, b) => {
        const aSelected = values.includes(a.value);
        const bSelected = values.includes(b.value);
        return aSelected && bSelected ? 0 : aSelected ? -1 : bSelected ? 1 : 0;
      });
    return newDist;
  }, [tableSummary.value, uiState.sort, filter]);

  const activeFieldState = useMemo(
    () => ({
      loading: false,
      summary: {
        valueCounts: sortedDistribution,
        internalsCount: tableSummary.value?.entitiesCount,
        internalsFilteredCount: tableSummary.value?.filteredEntitiesCount,
      },
      ...uiState,
    }),
    [
      sortedDistribution,
      tableSummary.value?.entitiesCount,
      tableSummary.value?.filteredEntitiesCount,
      uiState,
    ]
  );

  const tableFilter = useMemo(() => {
    return filter && fromEdaFilter(filter);
  }, [filter]);

  const handleSort = useCallback(
    (_: unknown, sort: MultiFieldSortSpec) => {
      sessionState.setVariableUISettings({
        [uiStateKey]: {
          ...uiState,
          sort,
        },
      });
    },
    [sessionState, uiStateKey, uiState]
  );

  const handleSearch = useCallback(
    (_: unknown, searchTerm: string) => {
      sessionState.setVariableUISettings({
        [uiStateKey]: {
          ...uiState,
          searchTerm,
        },
      });
    },
    [sessionState, uiStateKey, uiState]
  );

  const handlePagination = useCallback(
    (_: unknown, currentPage: number) => {
      sessionState.setVariableUISettings({
        [uiStateKey]: {
          ...uiState,
          currentPage,
        },
      });
    },
    [sessionState, uiStateKey, uiState]
  );

  const allValues = useMemo(() => {
    return (
      tableSummary.value?.distribution.map((entry) => entry.value) ??
      ([] as TableVariable['type'][])
    );
  }, [tableSummary.value]);

  const handleChange = useCallback(
    (_: unknown, values: string[] = allValues) => {
      const otherFilters = (sessionState.session?.filters ?? []).filter(
        (f) => f.entityId !== entity.id || f.variableId !== variable.id
      );

      if (values.length === 0) {
        sessionState.setFilters(otherFilters);
      } else {
        const valueProp =
          variable.type === 'string'
            ? 'stringSet'
            : variable.type === 'date'
            ? 'dateSet'
            : 'numberSet';
        sessionState.setFilters(
          otherFilters.concat({
            entityId: entity.id,
            variableId: variable.id,
            [valueProp]: values,
            type: valueProp,
          } as Filter)
        );
      }
    },
    [entity.id, sessionState, variable.id, variable.type]
  );

  return (
    <div style={{ position: 'relative' }} className="filter-param">
      {tableSummary.pending && (
        <Loading style={{ position: 'absolute', top: '-1.5em' }} radius={2} />
      )}
      {tableSummary.error && <pre>{String(tableSummary.error)}</pre>}
      {tableSummary.value &&
        tableSummary.value.entityId === entity.id &&
        tableSummary.value.variableId === variable.id && (
          <MembershipField
            displayName={entity.displayName}
            dataCount={tableSummary.value.entitiesCount}
            filteredDataCount={tableSummary.value.filteredEntitiesCount}
            filter={tableFilter}
            activeField={activeField}
            activeFieldState={activeFieldState}
            onChange={handleChange}
            onMemberSort={handleSort}
            onMemberSearch={handleSearch}
            onMemberChangeCurrentPage={handlePagination}
            selectByDefault={false}
          />
        )}
    </div>
  );
}
