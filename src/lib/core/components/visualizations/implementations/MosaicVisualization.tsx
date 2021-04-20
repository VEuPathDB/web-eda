// import MosaicControls from '@veupathdb/components/lib/components/plotControls/MosaicControls';
import Mosaic, {
  Props as MosaicProps,
} from '@veupathdb/components/lib/plots/MosaicPlot';
import { ErrorManagement } from '@veupathdb/components/lib/types/general';
// import { MosaicData } from '@veupathdb/components/lib/types/plots';
import { Loading } from '@veupathdb/wdk-client/lib/Components';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { getOrElse } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';
import { isEqual } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import {
  DataClient,
  MosaicRequestParams,
  // NumericMosaicRequestParams,
} from '../../../api/data-api';
import { usePromise } from '../../../hooks/promise';
import { useDataClient, useStudyMetadata } from '../../../hooks/workspace';
import { Filter } from '../../../types/filter';
import { PromiseType } from '../../../types/utility';
import { Variable } from '../../../types/variable';
import { DataElementConstraint } from '../../../types/visualization';
import { isMosaicVariable } from '../../filter/guards';
import { MosaicVariable } from '../../filter/types';
import { InputVariables } from '../InputVariables';
import { VisualizationProps, VisualizationType } from '../VisualizationTypes';

type MosaicData = Pick<
  MosaicProps,
  'data' | 'exposureValues' | 'outcomeValues' | 'widths'
>;

export const mosaicVisualization: VisualizationType = {
  gridComponent: GridComponent,
  selectorComponent: SelectorComponent,
  fullscreenComponent: FullscreenComponent,
  createDefaultConfig: createDefaultConfig,
};

function GridComponent(props: VisualizationProps) {
  const { visualization, computation, filters } = props;
  return (
    <MosaicViz
      visualization={visualization}
      computation={computation}
      filters={filters}
      fullscreen={false}
    />
  );
}

function SelectorComponent() {
  return <div>Pick me, I'm a mosaic plot!</div>;
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
    <MosaicViz
      visualization={visualization}
      updateVisualization={updateVisualization}
      computation={computation}
      filters={filters}
      fullscreen={true}
      constraints={dataElementConstraints}
    />
  );
}

function createDefaultConfig(): MosaicConfig {
  return {
    // enableOverlay: true,
  };
}

type MosaicConfig = t.TypeOf<typeof MosaicConfig>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
const MosaicConfig = t.partial({
  xAxisVariable: Variable,
  yAxisVariable: Variable,
});

type Props = VisualizationProps & {
  fullscreen: boolean;
  constraints?: Record<string, DataElementConstraint>[];
};

function MosaicViz(props: Props) {
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
      MosaicConfig.decode(visualization.configuration),
      getOrElse((): t.TypeOf<typeof MosaicConfig> => createDefaultConfig())
    );
  }, [visualization.configuration]);

  const updateVizConfig = useCallback(
    (newConfig: Partial<MosaicConfig>) => {
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
      const { xAxisVariable, yAxisVariable } = values;

      updateVizConfig({
        xAxisVariable,
        yAxisVariable,
      });
    },
    [updateVizConfig, vizConfig]
  );

  const findVariable = useCallback(
    (variable?: Variable) => {
      if (variable == null) return undefined;
      return entities
        .find((e) => e.id === variable.entityId)
        ?.variables.find((v) => v.id === variable.variableId);
    },
    [entities]
  );

  const data = usePromise(
    useCallback(async (): Promise<MosaicData> => {
      const xAxisVariable = findVariable(vizConfig.xAxisVariable);
      const yAxisVariable = findVariable(vizConfig.yAxisVariable);
      if (
        vizConfig.xAxisVariable == null ||
        xAxisVariable == null ||
        vizConfig.yAxisVariable == null ||
        yAxisVariable == null
      )
        return Promise.reject(
          new Error('Please choose a variable for each axis')
        );

      if (xAxisVariable && !isMosaicVariable(xAxisVariable))
        throw new Error(
          `Please choose another x-axis variable. '${xAxisVariable.displayName}' is not suitable for mosaics`
        );

      if (yAxisVariable && !isMosaicVariable(yAxisVariable))
        throw new Error(
          `Please choose another y-axis variable. '${yAxisVariable.displayName}' is not suitable for mosaics`
        );

      const params = getRequestParams(
        studyId,
        filters ?? [],
        vizConfig.xAxisVariable,
        vizConfig.yAxisVariable
      );
      const response = dataClient.getMosaic(
        computation.type,
        params as MosaicRequestParams
      );
      return mosaicResponseToData(await response);
    }, [
      studyId,
      filters,
      dataClient,
      vizConfig,
      findVariable,
      computation.type,
    ])
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {fullscreen && <h1>Mosaic</h1>}
      {fullscreen && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <InputVariables
            inputs={[
              {
                name: 'xAxisVariable',
                label: 'x-axis variable',
              },
              {
                name: 'yAxisVariable',
                label: 'y-axis variable',
              },
            ]}
            entities={entities}
            values={{
              xAxisVariable: vizConfig.xAxisVariable,
              yAxisVariable: vizConfig.yAxisVariable,
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
          <MosaicPlotWithControls
            data={data.value.data}
            exposureValues={data.value.exposureValues}
            outcomeValues={data.value.outcomeValues}
            exposureLabel={vizConfig.xAxisVariable!.variableId}
            outcomeLabel={vizConfig.yAxisVariable!.variableId}
            widths={data.value.widths}
            width="100%"
            height={400}
            showLegend={true}
          />
        ) : (
          // thumbnail/grid view
          <Mosaic
            data={data.value.data}
            exposureValues={data.value.exposureValues}
            outcomeValues={data.value.outcomeValues}
            widths={data.value.widths}
            width={350}
            height={280}
            showModebar={false}
            showLegend={false}
            exposureLabel=""
            outcomeLabel=""
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

type MosaicPlotWithControlsProps = MosaicProps;

function MosaicPlotWithControls({
  data,
  ...mosaicProps
}: MosaicPlotWithControlsProps) {
  // TODO Use UIState
  const displayLibraryControls = false;
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
      <Mosaic
        {...mosaicProps}
        data={data}
        showModebar={displayLibraryControls}
      />
      {/* <MosaicControls
        label="Mosaic Controls"
        displayLegend={false}
        displayLibraryControls={displayLibraryControls}
        errorManagement={errorManagement}
      /> */}
    </div>
  );
}

/**
 * Reformat response from mosaic endpoints into complete MosaicData
 * @param response
 * @returns MosaicData
 */
export function mosaicResponseToData(
  response: PromiseType<ReturnType<DataClient['getMosaic']>>
): MosaicData {
  if (response.data.length === 0)
    throw Error(`Expected one or more data series, but got zero`);
  return {
    data: response.data[0].y,
    widths: response.data[0].x,
    exposureValues: response.data[0].xLabel,
    outcomeValues: response.data[0].yLabel,
  };
}

function getRequestParams(
  studyId: string,
  filters: Filter[],
  xAxisVariable: Variable,
  yAxisVariable: Variable
): MosaicRequestParams {
  return {
    studyId,
    filters,
    config: {
      outputEntityId: xAxisVariable.entityId,
      xAxisVariable: xAxisVariable,
      yAxisVariable: yAxisVariable,
    },
  } as MosaicRequestParams;
}
