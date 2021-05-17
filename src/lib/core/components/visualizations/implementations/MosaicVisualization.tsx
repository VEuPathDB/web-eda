// import MosaicControls from '@veupathdb/components/lib/components/plotControls/MosaicControls';
import Mosaic, {
  Props as MosaicProps,
} from '@veupathdb/components/lib/plots/MosaicPlot';
// import { ErrorManagement } from '@veupathdb/components/lib/types/general';
import { Loading } from '@veupathdb/wdk-client/lib/Components';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { getOrElse } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';
import React, { useCallback, useMemo } from 'react';
import { DataClient, MosaicRequestParams } from '../../../api/data-api';
import { usePromise } from '../../../hooks/promise';
import { useDataClient, useStudyMetadata } from '../../../hooks/workspace';
import { Filter } from '../../../types/filter';
import { PromiseType } from '../../../types/utility';
import { Variable } from '../../../types/variable';
import { DataElementConstraint } from '../../../types/visualization';
import { isMosaicVariable, isTwoByTwoVariable } from '../../filter/guards';
import { InputVariables } from '../InputVariables';
import { VisualizationProps, VisualizationType } from '../VisualizationTypes';
import _ from 'lodash';

type MosaicData = Pick<
  MosaicProps,
  'data' | 'independentValues' | 'dependentValues'
>;

type TwoByTwoData = MosaicData & {
  pValue: number | string;
  relativeRisk: number;
  rrInterval: string;
  oddsRatio: number;
  orInterval: string;
};

export const mosaicVisualization: VisualizationType = {
  gridComponent: GridComponent,
  selectorComponent: SelectorComponent,
  fullscreenComponent: FullscreenComponent,
  createDefaultConfig: createDefaultConfig,
};

export const twoByTwoVisualization: VisualizationType = {
  gridComponent: TwoByTwoGridComponent,
  selectorComponent: TwoByTwoSelectorComponent,
  fullscreenComponent: TwoByTwoFullscreenComponent,
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
  return <div>Pick me, I'm a contingency table!</div>;
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

function TwoByTwoGridComponent(props: VisualizationProps) {
  const { visualization, computation, filters } = props;
  return (
    <MosaicViz
      visualization={visualization}
      computation={computation}
      filters={filters}
      fullscreen={false}
      isTwoByTwo={true}
    />
  );
}

function TwoByTwoSelectorComponent() {
  return <div>Pick me, I'm a 2x2 contingency table!</div>;
}

function TwoByTwoFullscreenComponent(props: VisualizationProps) {
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
      isTwoByTwo={true}
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
  isTwoByTwo?: boolean;
  constraints?: Record<string, DataElementConstraint>[];
};

function MosaicViz(props: Props) {
  const {
    computation,
    visualization,
    updateVisualization,
    filters,
    fullscreen,
    isTwoByTwo = false,
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
    [updateVizConfig]
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
    useCallback(async (): Promise<MosaicData | TwoByTwoData> => {
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

      const isValidVariable = isTwoByTwo
        ? isTwoByTwoVariable
        : isMosaicVariable;

      if (xAxisVariable && !isValidVariable(xAxisVariable))
        throw new Error(
          `Please choose another x-axis variable. '${
            xAxisVariable.displayName
          }' is not suitable for ${isTwoByTwo ? '2x2' : ''} contingency tables`
        );

      if (yAxisVariable && !isValidVariable(yAxisVariable))
        throw new Error(
          `Please choose another y-axis variable. '${
            yAxisVariable.displayName
          }' is not suitable for ${isTwoByTwo ? '2x2' : ''} contingency tables`
        );

      const params = getRequestParams(
        studyId,
        filters ?? [],
        vizConfig.xAxisVariable,
        vizConfig.yAxisVariable
      );

      if (isTwoByTwo) {
        const response = dataClient.getTwoByTwo(
          computation.type,
          params as MosaicRequestParams
        );

        return twoByTwoResponseToData(await response);
      } else {
        const response = dataClient.getMosaic(
          computation.type,
          params as MosaicRequestParams
        );

        return mosaicResponseToData(await response);
      }
    }, [
      studyId,
      filters,
      dataClient,
      vizConfig,
      findVariable,
      computation.type,
      isTwoByTwo,
    ])
  );

  let plotComponent: JSX.Element;

  if (data.value) {
    let statsTable = undefined;

    if (isTwoByTwo) {
      const twoByTwoData = data.value as TwoByTwoData;
      const rangeRegex = /(\d+\.\d+) {2}- {2}(\d+\.\d+)/;
      const orIntervalMatch = twoByTwoData.orInterval.match(rangeRegex);
      const rrIntervalMatch = twoByTwoData.rrInterval.match(rangeRegex);

      statsTable = (
        <div className="TwoByTwoVisualization-StatsTable">
          <table>
            <tbody>
              <tr>
                <th></th>
                <th>Value</th>
                <th>95% confidence interval</th>
              </tr>
              <tr>
                <td>p-value</td>
                <td>{twoByTwoData.pValue}</td>
                <td></td>
              </tr>
              <tr>
                <td>Odds ratio</td>
                <td>{twoByTwoData.oddsRatio}</td>
                {orIntervalMatch && (
                  <td>{`${Number(orIntervalMatch[1]).toFixed(4)} - ${Number(
                    orIntervalMatch[2]
                  ).toFixed(4)}`}</td>
                )}
              </tr>
              <tr>
                <td>Relative risk</td>
                <td>{twoByTwoData.relativeRisk}</td>
                {rrIntervalMatch && (
                  <td>{`${Number(rrIntervalMatch[1]).toFixed(4)} - ${Number(
                    rrIntervalMatch[2]
                  ).toFixed(4)}`}</td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    plotComponent = fullscreen ? (
      <div className="TwoByTwoVisualization">
        <div className="TwoByTwoVisualization-Plot">
          <MosaicPlotWithControls
            data={data.value.data}
            independentValues={data.value.independentValues}
            dependentValues={data.value.dependentValues}
            independentLabel={
              findVariable(vizConfig.xAxisVariable)!.displayName
            }
            dependentLabel={findVariable(vizConfig.yAxisVariable)!.displayName}
            showLegend={true}
          />
        </div>
        {isTwoByTwo && statsTable}
      </div>
    ) : (
      // thumbnail/grid view
      <Mosaic
        data={data.value.data}
        independentValues={data.value.independentValues}
        dependentValues={data.value.dependentValues}
        width={350}
        height={280}
        showModebar={false}
        showLegend={false}
        independentLabel=""
        dependentLabel=""
      />
    );
  } else {
    plotComponent = (
      <i
        className="fa fa-th-large"
        style={{
          fontSize: fullscreen ? '34em' : '12em',
          color: '#aaa',
        }}
      ></i>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {fullscreen && <h1>{isTwoByTwo ? '2x2' : 'RxC'} Contigency Table</h1>}
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
      {plotComponent}
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
  // const errorManagement = useMemo((): ErrorManagement => {
  //   return {
  //     errors: [],
  //     addError: (error: Error) => {},
  //     removeError: (error: Error) => {},
  //     clearAllErrors: () => {},
  //   };
  // }, []);

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
  if (response.mosaic.data.length === 0)
    throw Error(`Expected one or more data series, but got zero`);

  // Transpose data table to match mosaic component expectations
  const data = _.unzip(response.mosaic.data[0].value);

  return {
    data: data,
    independentValues: response.mosaic.data[0].xLabel,
    dependentValues: response.mosaic.data[0].yLabel,
  };
}

/**
 * Reformat response from mosaic endpoints into complete MosaicData
 * @param response
 * @returns MosaicData
 */
export function twoByTwoResponseToData(
  response: PromiseType<ReturnType<DataClient['getTwoByTwo']>>
): TwoByTwoData {
  if (response.mosaic.data.length === 0)
    throw Error(`Expected one or more data series, but got zero`);

  // Transpose data table to match mosaic component expectations
  const data = _.unzip(response.mosaic.data[0].value);

  return {
    data: data,
    independentValues: response.mosaic.data[0].xLabel,
    dependentValues: response.mosaic.data[0].yLabel,
    pValue: response.statsTable[0].pvalue[1],
    relativeRisk: response.statsTable[0].relativerisk[1],
    rrInterval: response.statsTable[0].rrInterval[1],
    oddsRatio: response.statsTable[0].oddsratio[1],
    orInterval: response.statsTable[0].orInterval[1],
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
