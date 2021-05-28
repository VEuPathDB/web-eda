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
import { isMosaicVariable, isTwoByTwoVariable } from '../../filter/guards';
import { InputVariables } from '../InputVariables';
import { VisualizationProps, VisualizationType } from '../VisualizationTypes';
import _ from 'lodash';

type MosaicData = Pick<
  MosaicProps,
  'data' | 'independentValues' | 'dependentValues'
>;

type ContTableData = MosaicData &
  Partial<{
    pValue: number | string;
    degreesFreedom: number;
    chisq: number;
  }>;

type TwoByTwoData = MosaicData &
  Partial<{
    pValue: number | string;
    relativeRisk: number;
    rrInterval: string;
    oddsRatio: number;
    orInterval: string;
  }>;

export const contTableVisualization: VisualizationType = {
  gridComponent: ContTableGridComponent,
  selectorComponent: ContTableSelectorComponent,
  fullscreenComponent: ContTableFullscreenComponent,
  createDefaultConfig: createDefaultConfig,
};

export const twoByTwoVisualization: VisualizationType = {
  gridComponent: TwoByTwoGridComponent,
  selectorComponent: TwoByTwoSelectorComponent,
  fullscreenComponent: TwoByTwoFullscreenComponent,
  createDefaultConfig: createDefaultConfig,
};

function ContTableGridComponent(props: VisualizationProps) {
  return <MosaicViz {...props} fullscreen={false} />;
}

function ContTableSelectorComponent() {
  return <div>Pick me, I'm a contingency table!</div>;
}

function ContTableFullscreenComponent(props: VisualizationProps) {
  return <MosaicViz {...props} fullscreen />;
}

function TwoByTwoGridComponent(props: VisualizationProps) {
  return <MosaicViz {...props} fullscreen={false} isTwoByTwo />;
}

function TwoByTwoSelectorComponent() {
  return <div>Pick me, I'm a 2x2 contingency table!</div>;
}

function TwoByTwoFullscreenComponent(props: VisualizationProps) {
  return <MosaicViz {...props} fullscreen isTwoByTwo />;
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
};

function MosaicViz(props: Props) {
  const {
    computation,
    visualization,
    updateVisualization,
    filters,
    fullscreen,
    isTwoByTwo = false,
    dataElementConstraints,
    dataElementDependencyOrder,
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
    useCallback(async (): Promise<ContTableData | TwoByTwoData> => {
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

      if (xAxisVariable === yAxisVariable)
        throw new Error(
          'The X and Y variables must not be the same. Please choose different variables for X and Y.'
        );

      const params = getRequestParams(
        studyId,
        filters ?? [],
        vizConfig.xAxisVariable,
        vizConfig.yAxisVariable
      );

      if (isTwoByTwo) {
        const response = dataClient.getTwoByTwo(computation.type, params);

        return twoByTwoResponseToData(await response);
      } else {
        const response = dataClient.getContTable(computation.type, params);

        return contTableResponseToData(await response);
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

  const xAxisVariableName = findVariable(vizConfig.xAxisVariable)?.displayName;
  const yAxisVariableName = findVariable(vizConfig.yAxisVariable)?.displayName;
  let statsTable = undefined;

  if (isTwoByTwo) {
    const twoByTwoData = data.value as TwoByTwoData | undefined;

    statsTable = (
      <div className="MosaicVisualization-StatsTable">
        <table>
          <tbody>
            <tr>
              <th></th>
              <th>Value</th>
              <th>95% confidence interval</th>
            </tr>
            <tr>
              <td>p-value</td>
              <td>{twoByTwoData?.pValue ?? 'N/A'}</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td>Odds ratio</td>
              <td>{twoByTwoData?.oddsRatio ?? 'N/A'}</td>
              <td>{twoByTwoData?.orInterval ?? 'N/A'}</td>
            </tr>
            <tr>
              <td>Relative risk</td>
              <td>{twoByTwoData?.relativeRisk ?? 'N/A'}</td>
              <td>{twoByTwoData?.rrInterval ?? 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  } else {
    const contTableData = data.value as ContTableData | undefined;

    statsTable = (
      <div className="MosaicVisualization-StatsTable">
        <table>
          <tbody>
            <tr>
              <td>p-value</td>
              <td>{contTableData?.pValue ?? 'N/A'}</td>
            </tr>
            <tr>
              <td>Degrees of freedom</td>
              <td>{contTableData?.degreesFreedom ?? 'N/A'}</td>
            </tr>
            <tr>
              <td>Chi-squared</td>
              <td>{contTableData?.chisq ?? 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  const plotComponent = fullscreen ? (
    <div className="MosaicVisualization">
      <div className="MosaicVisualization-Plot">
        <MosaicPlotWithControls
          data={data.value && !data.pending ? data.value.data : [[]]}
          independentValues={
            data.value && !data.pending ? data.value.independentValues : []
          }
          dependentValues={
            data.value && !data.pending ? data.value.dependentValues : []
          }
          height={450}
          independentLabel={
            data.value && !data.pending && xAxisVariableName
              ? xAxisVariableName
              : ''
          }
          dependentLabel={
            data.value && !data.pending && yAxisVariableName
              ? yAxisVariableName
              : ''
          }
          showLegend={true}
        />
      </div>
      {statsTable}
    </div>
  ) : (
    // thumbnail/grid view
    <Mosaic
      data={data.value && !data.pending ? data.value.data : [[]]}
      independentValues={
        data.value && !data.pending ? data.value.independentValues : []
      }
      dependentValues={
        data.value && !data.pending ? data.value.dependentValues : []
      }
      width={300}
      height={180}
      margin={{ t: 40, b: 20, l: 20, r: 10 }}
      showColumnLabels={false}
      showModebar={false}
      showLegend={false}
      staticPlot={true}
      independentLabel=""
      dependentLabel=""
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
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
            constraints={dataElementConstraints}
            dataElementDependencyOrder={dataElementDependencyOrder}
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
export function contTableResponseToData(
  response: PromiseType<ReturnType<DataClient['getContTable']>>
): ContTableData {
  if (response.mosaic.data.length === 0)
    throw Error(`Expected one or more data series, but got zero`);

  // Transpose data table to match mosaic component expectations
  const data = _.unzip(response.mosaic.data[0].value);

  return {
    data: data,
    independentValues: response.mosaic.data[0].xLabel,
    dependentValues: response.mosaic.data[0].yLabel,
    pValue: response.statsTable[0].pvalue,
    degreesFreedom: response.statsTable[0].degreesFreedom,
    chisq: response.statsTable[0].chisq,
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
    pValue: response.statsTable[0].pvalue,
    relativeRisk: response.statsTable[0].relativerisk,
    rrInterval: response.statsTable[0].rrInterval,
    oddsRatio: response.statsTable[0].oddsratio,
    orInterval: response.statsTable[0].orInterval,
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
  };
}
