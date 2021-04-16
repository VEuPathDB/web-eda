import HistogramControls from '@veupathdb/components/lib/components/plotControls/HistogramControls';
import Histogram, {
  HistogramProps,
} from '@veupathdb/components/lib/plots/Histogram';
import {
  ErrorManagement,
  NumberOrTimeDelta,
  NumberOrTimeDeltaRange,
  TimeDelta,
} from '@veupathdb/components/lib/types/general';
import { isTimeDelta } from '@veupathdb/components/lib/types/guards';
import { HistogramData } from '@veupathdb/components/lib/types/plots';
import { Loading } from '@veupathdb/wdk-client/lib/Components';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { getOrElse } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';
import { isEqual } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import {
  DataClient,
  DateHistogramRequestParams,
  NumericHistogramRequestParams,
} from '../../../api/data-api';
import { usePromise } from '../../../hooks/promise';
import { useDataClient, useStudyMetadata } from '../../../hooks/workspace';
import { Filter } from '../../../types/filter';
import { PromiseType } from '../../../types/utility';
import { Variable } from '../../../types/variable';
import { DataElementConstraint } from '../../../types/visualization';
import {
  ISODateStringToZuluDate,
  parseTimeDelta,
} from '../../../utils/date-conversion';
import { findEntityAndVariable } from '../../../utils/study-metadata';
import { isHistogramVariable } from '../../filter/guards';
import { HistogramVariable } from '../../filter/types';
import { InputVariables } from '../InputVariables';
import { VisualizationProps, VisualizationType } from '../VisualizationTypes';

export const histogramVisualization: VisualizationType = {
  gridComponent: GridComponent,
  selectorComponent: SelectorComponent,
  fullscreenComponent: FullscreenComponent,
  createDefaultConfig: createDefaultConfig,
};

function GridComponent(props: VisualizationProps) {
  const { visualization, computation, filters } = props;
  return (
    <HistogramViz
      visualization={visualization}
      computation={computation}
      filters={filters}
      fullscreen={false}
    />
  );
}

function SelectorComponent() {
  return <div>Pick me, I'm a histogram!</div>;
}

function FullscreenComponent(props: VisualizationProps) {
  const {
    visualization,
    updateVisualization,
    computation,
    filters,
    dataElementConstraints,
  } = props;
  return (
    <HistogramViz
      visualization={visualization}
      updateVisualization={updateVisualization}
      computation={computation}
      filters={filters}
      fullscreen={true}
      constraints={dataElementConstraints}
    />
  );
}

function createDefaultConfig(): HistogramConfig {
  return {
    enableOverlay: true,
  };
}

type HistogramConfig = t.TypeOf<typeof HistogramConfig>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
const HistogramConfig = t.intersection([
  t.type({
    enableOverlay: t.boolean,
  }),
  t.partial({
    xAxisVariable: Variable,
    overlayVariable: Variable,
    binWidth: t.number,
    binWidthTimeUnit: t.string, // TO DO: constrain to weeks, months etc like Unit from date-arithmetic and/or R
  }),
]);

type Props = VisualizationProps & {
  fullscreen: boolean;
  constraints?: Record<string, DataElementConstraint>[];
};

function HistogramViz(props: Props) {
  const {
    computation,
    visualization,
    updateVisualization,
    filters,
    fullscreen,
    constraints,
  } = props;
  const studyMetadata = useStudyMetadata();
  const { id: studyId } = studyMetadata;
  const entities = useMemo(
    () =>
      Array.from(preorder(studyMetadata.rootEntity, (e) => e.children || [])),
    [studyMetadata]
  );
  const dataClient: DataClient = useDataClient();

  const vizConfig = useMemo(() => {
    return pipe(
      HistogramConfig.decode(visualization.configuration),
      getOrElse((): t.TypeOf<typeof HistogramConfig> => createDefaultConfig())
    );
  }, [visualization.configuration]);

  const updateVizConfig = useCallback(
    (newConfig: Partial<HistogramConfig>) => {
      if (updateVisualization) {
        updateVisualization({
          ...visualization,
          configuration: {
            ...vizConfig,
            ...newConfig,
          },
        });
      }
    },
    [updateVisualization, visualization, vizConfig]
  );

  const handleInputVariableChange = useCallback(
    (
      values: Record<
        string,
        { entityId: string; variableId: string } | undefined
      >
    ) => {
      const { xAxisVariable, overlayVariable } = values;
      const keepBin = isEqual(xAxisVariable, vizConfig.xAxisVariable);
      updateVizConfig({
        xAxisVariable,
        overlayVariable,
        binWidth: keepBin ? vizConfig.binWidth : undefined,
        binWidthTimeUnit: keepBin ? vizConfig.binWidthTimeUnit : undefined,
      });
    },
    [updateVizConfig, vizConfig]
  );

  const onBinWidthChange = useCallback(
    ({ binWidth: newBinWidth }: { binWidth: NumberOrTimeDelta }) => {
      if (newBinWidth) {
        updateVizConfig({
          binWidth: isTimeDelta(newBinWidth) ? newBinWidth[0] : newBinWidth,
          binWidthTimeUnit: isTimeDelta(newBinWidth)
            ? newBinWidth[1]
            : undefined,
        });
      }
    },
    [updateVizConfig]
  );

  const data = usePromise(
    useCallback(async (): Promise<HistogramData> => {
      const { variable: xAxisVariable } =
        findEntityAndVariable(entities, vizConfig.xAxisVariable) ?? {};
      if (vizConfig.xAxisVariable == null || xAxisVariable == null)
        return Promise.reject(new Error('Please choose a main variable'));

      if (xAxisVariable && !isHistogramVariable(xAxisVariable))
        throw new Error(
          `Please choose another main variable. '${xAxisVariable.displayName}' is not suitable for histograms`
        );

      const params = getRequestParams(
        studyId,
        filters ?? [],
        vizConfig.xAxisVariable,
        xAxisVariable.type,
        vizConfig.enableOverlay ? vizConfig.overlayVariable : undefined,
        vizConfig.binWidth,
        vizConfig.binWidthTimeUnit
      );
      const response =
        xAxisVariable.type === 'date'
          ? dataClient.getDateHistogramBinWidth(
              computation.type,
              params as DateHistogramRequestParams
            )
          : dataClient.getNumericHistogramBinWidth(
              computation.type,
              params as NumericHistogramRequestParams
            );
      return histogramResponseToData(await response, xAxisVariable.type);
    }, [studyId, filters, dataClient, vizConfig, entities, computation.type])
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {fullscreen && <h1>Histogram</h1>}
      {fullscreen && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <InputVariables
            inputs={[
              {
                name: 'xAxisVariable',
                label: 'Main variable',
              },
              {
                name: 'overlayVariable',
                label: 'Overlay variable',
              },
            ]}
            entities={entities}
            values={{
              xAxisVariable: vizConfig.xAxisVariable,
              overlayVariable: vizConfig.overlayVariable,
            }}
            onChange={handleInputVariableChange}
            constraints={constraints}
          />
        </div>
      )}

      {data.pending && (
        <Loading style={{ position: 'absolute', top: '-1.5em' }} radius={2} />
      )}
      {data.error && fullscreen && (
        <div
          style={{
            fontSize: '1.2em',
            padding: '1em',
            background: 'rgb(255, 233, 233) none repeat scroll 0% 0%',
            borderRadius: '.5em',
            margin: '.5em 0',
            color: '#333',
            border: '1px solid #d9cdcd',
            display: 'flex',
          }}
        >
          <i className="fa fa-warning" style={{ marginRight: '1ex' }}></i>{' '}
          {data.error instanceof Error
            ? data.error.message
            : String(data.error)}
        </div>
      )}
      {data.value ? (
        fullscreen ? (
          <HistogramPlotWithControls
            data={data.value}
            onBinWidthChange={onBinWidthChange}
            width="100%"
            height={400}
            orientation={'vertical'}
            barLayout={'stack'}
            displayLegend={data.value?.series.length > 1}
          />
        ) : (
          // thumbnail/grid view
          <Histogram
            data={data.value}
            width={350}
            height={280}
            orientation={'vertical'}
            barLayout={'stack'}
            displayLibraryControls={false}
            displayLegend={false}
            independentAxisLabel=""
            dependentAxisLabel=""
          />
        )
      ) : (
        <i
          className="fa fa-bar-chart"
          style={{
            fontSize: fullscreen ? '34em' : '12em',
            color: '#aaa',
          }}
        ></i>
      )}
    </div>
  );
}

type HistogramPlotWithControlsProps = HistogramProps & {
  onBinWidthChange: ({
    binWidth: newBinWidth,
  }: {
    binWidth: NumberOrTimeDelta;
  }) => void;
};

function HistogramPlotWithControls({
  data,
  onBinWidthChange,
  ...histogramProps
}: HistogramPlotWithControlsProps) {
  // TODO Use UIState
  const barLayout = 'stack';
  const displayLibraryControls = false;
  const opacity = 100;
  const errorManagement = useMemo((): ErrorManagement => {
    return {
      errors: [],
      addError: (error: Error) => {},
      removeError: (error: Error) => {},
      clearAllErrors: () => {},
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Histogram
        {...histogramProps}
        data={data}
        opacity={opacity}
        displayLibraryControls={displayLibraryControls}
        showBarValues={false}
        barLayout={barLayout}
      />
      {data.binWidth && data.binWidthRange && data.binWidthStep && (
        <HistogramControls
          label="Histogram Controls"
          valueType={data.valueType}
          barLayout={barLayout}
          displayLegend={false /* should not be a required prop */}
          displayLibraryControls={displayLibraryControls}
          opacity={opacity}
          orientation={histogramProps.orientation}
          binWidth={data.binWidth}
          selectedUnit={
            data.binWidth && isTimeDelta(data.binWidth)
              ? data.binWidth[1]
              : undefined
          }
          onBinWidthChange={({ binWidth: newBinWidth }) => {
            onBinWidthChange({ binWidth: newBinWidth });
          }}
          binWidthRange={data.binWidthRange}
          binWidthStep={data.binWidthStep}
          errorManagement={errorManagement}
        />
      )}
    </div>
  );
}

/**
 * Reformat response from histogram endpoints into complete HistogramData
 * @param response
 * @returns HistogramData
 */
export function histogramResponseToData(
  response: PromiseType<
    ReturnType<
      DataClient['getDateHistogramBinWidth' | 'getNumericHistogramBinWidth']
    >
  >,
  type: HistogramVariable['type']
): HistogramData {
  if (response.data.length === 0)
    throw Error(`Expected one or more data series, but got zero`);

  const binWidth =
    type === 'number'
      ? parseFloat(response.config.binWidth as string) || 1
      : parseTimeDelta(response.config.binWidth as string);
  const { min, max, step } = response.config.binSlider;
  const binWidthRange = (type === 'number'
    ? { min, max }
    : {
        min,
        max,
        unit: (binWidth as TimeDelta)[1],
      }) as NumberOrTimeDeltaRange;
  const binWidthStep = step || 0.1;
  return {
    series: response.data.map((data, index) => ({
      name: data.overlayVariableDetails?.value ?? `series ${index}`,
      // color: TO DO
      bins: data.value
        .map((_, index) => ({
          binStart:
            type === 'number'
              ? Number(data.binStart[index])
              : ISODateStringToZuluDate(data.binStart[index]),
          binEnd:
            type === 'number'
              ? Number(data.binEnd[index])
              : ISODateStringToZuluDate(data.binEnd[index]),
          binLabel: data.binLabel[index],
          count: data.value[index],
        }))
        .sort((a, b) => a.binStart.valueOf() - b.binStart.valueOf()),
      // TO DO: review necessity of sort if back end (or plot component) does sorting?
    })),
    valueType: type,
    binWidth,
    binWidthRange,
    binWidthStep,
  };
}

function getRequestParams(
  studyId: string,
  filters: Filter[],
  variable: Variable,
  variableType: 'number' | 'date',
  overlayVariable?: Variable,
  binWidth?: number,
  binWidthTimeUnit?: string
): NumericHistogramRequestParams | DateHistogramRequestParams {
  const binOption = binWidth
    ? {
        binWidth:
          variableType === 'number'
            ? binWidth
            : `${binWidth} ${binWidthTimeUnit}`,
      }
    : {
        // numBins: 10,
      };

  return {
    studyId,
    filters,
    config: {
      outputEntityId: variable.entityId,
      valueSpec: 'count',
      xAxisVariable: variable,
      overlayVariable,
      ...binOption,
    },
  } as NumericHistogramRequestParams | DateHistogramRequestParams;
}
