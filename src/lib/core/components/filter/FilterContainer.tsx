import React, { useEffect, useMemo, useState } from 'react';
import { DistributionResponse } from '../../api/SubsettingClient/types';
import { AnalysisState } from '../../hooks/analysis';
import { useSubsettingClient } from '../../hooks/workspace';
import {
  StudyEntity,
  StudyMetadata,
  Variable,
  MultiFilterVariable,
  NumberVariable,
} from '../../types/study';
import { isHistogramVariable, isTableVariable } from './guards';
import { HistogramFilter, UIState } from './HistogramFilter';
import { MultiFilter } from './MultiFilter';
import { TableFilter } from './TableFilter';
import UnknownFilter from './UnknownFilter';
import { getDistribution } from './util';
import { useDefaultAxisRange } from '../../hooks/computeDefaultAxisRange';
import { DateRange, NumberOrDateRange, NumberRange } from '../../types/general';
import { HistogramVariable } from './types';

interface Props {
  studyMetadata: StudyMetadata;
  variable: Variable | MultiFilterVariable;
  entity: StudyEntity;
  analysisState: AnalysisState;
  totalEntityCount: number;
  filteredEntityCount: number;
}

export function FilterContainer(props: Props) {
  const subsettingClient = useSubsettingClient();
  const [data, setData] = useState<
    Awaited<ReturnType<typeof getDistribution>> | undefined | null
  >();
  const variable = props.variable;
  const variableIsHistogramVariable = isHistogramVariable(variable);
  const defaultIndependentRange = useDefaultAxisRange(
    variableIsHistogramVariable ? variable : undefined
  );

  const defaultUIState: UIState | undefined = useMemo(() => {
    if (variableIsHistogramVariable) {
      const otherDefaults = {
        dependentAxisLogScale: false,
      };

      if (NumberVariable.is(variable))
        return {
          binWidth:
            variable.distributionDefaults.binWidthOverride ??
            variable.distributionDefaults.binWidth ??
            0.1,
          binWidthTimeUnit: undefined,
          independentAxisRange: defaultIndependentRange as NumberRange,
          ...otherDefaults,
        };
      else if ('distributionDefaults' in variable) {
        // else date variable
        const binWidth =
          variable.distributionDefaults.binWidthOverride ??
          variable.distributionDefaults.binWidth;
        const binUnits = variable.distributionDefaults.binUnits;

        return {
          binWidth: binWidth ?? 1,
          binWidthTimeUnit: binUnits ?? variable.distributionDefaults.binUnits!, // bit nasty!
          independentAxisRange: defaultIndependentRange as DateRange,
          ...otherDefaults,
        };
      }

      // Nasty TS hack --- hopefully never gets here?
      console.log('Uh-oh...');
      return {} as any;
    }

    return undefined;
  }, [variableIsHistogramVariable, variable, defaultIndependentRange]);

  useEffect(() => {
    if (
      variableIsHistogramVariable &&
      'distributionDefaults' in variable &&
      defaultUIState
    ) {
      const asyncFunc = async () => {
        if ('distributionDefaults' in variable) {
          const distribution = await getDistribution<DistributionResponse>(
            {
              entityId: props.entity.id,
              variableId: variable.id,
              filters: [],
            },
            (filters) => {
              return subsettingClient.getDistribution(
                props.studyMetadata.id,
                props.entity.id,
                variable.id,
                {
                  valueSpec: 'count',
                  filters,
                  binSpec: {
                    displayRangeMin: defaultUIState.independentAxisRange.min,
                    displayRangeMax: defaultUIState.independentAxisRange.max,
                    binWidth: defaultUIState.binWidth,
                    binUnits: defaultUIState.binWidthTimeUnit,
                  },
                }
              );
            }
          );

          setData(distribution);
        }
      };

      asyncFunc();
    } else setData(null);
  }, [
    defaultUIState,
    props.entity.id,
    props.studyMetadata.id,
    subsettingClient,
    variable,
    variableIsHistogramVariable,
  ]);

  console.log({
    variable,
    data,
    defaultIndependentRange,
    defaultUIState,
  });

  return !variableIsHistogramVariable || data ? (
    narrowProps(isHistogramVariable, props) ? (
      <HistogramFilter {...props} />
    ) : narrowProps(isTableVariable, props) ? (
      <TableFilter {...props} />
    ) : narrowProps(MultiFilterVariable.is, props) ? (
      <MultiFilter {...props} />
    ) : (
      <UnknownFilter />
    )
  ) : (
    <></>
  );
}

interface NarrowedProps<T extends Variable | MultiFilterVariable>
  extends Props {
  variable: T;
}

function narrowProps<T extends Variable | MultiFilterVariable>(
  guard: (variable: Variable | MultiFilterVariable) => variable is T,
  props: Props
): props is NarrowedProps<T> {
  return guard(props.variable);
}
