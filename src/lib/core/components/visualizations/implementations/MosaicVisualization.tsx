// import MosaicControls from '@veupathdb/components/lib/components/plotControls/MosaicControls';
import Mosaic, {
  MosaicPlotProps as MosaicProps,
} from '@veupathdb/components/lib/plots/MosaicPlot';
import { MosaicData } from '@veupathdb/components/lib/types/plots';
import { ContingencyTable } from '@veupathdb/components/lib/components/ContingencyTable';
// import { ErrorManagement } from '@veupathdb/components/lib/types/general';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { getOrElse } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import {
  CompleteCasesTable,
  DataClient,
  MosaicRequestParams,
} from '../../../api/data-api';
import { usePromise } from '../../../hooks/promise';
import { useFindEntityAndVariable } from '../../../hooks/study';
import { useDataClient, useStudyMetadata } from '../../../hooks/workspace';
import { useFindOutputEntity } from '../../../hooks/findOutputEntity';
import { Filter } from '../../../types/filter';
import { PromiseType } from '../../../types/utility';
import { VariableDescriptor } from '../../../types/variable';
import { VariableCoverageTable } from '../../VariableCoverageTable';
import { InputVariables } from '../InputVariables';
import { OutputEntityTitle } from '../OutputEntityTitle';
import { VisualizationProps, VisualizationType } from '../VisualizationTypes';
import contingency from './selectorIcons/contingency.svg';
import mosaic from './selectorIcons/mosaic.svg';
import Tabs from '@veupathdb/components/lib/components/Tabs';

interface MosaicDataWithCoverageStatistics extends MosaicData {
  completeCases: CompleteCasesTable;
  outputSize: number;
}

type ContTableData = MosaicDataWithCoverageStatistics &
  Partial<{
    pValue: number | string;
    degreesFreedom: number;
    chisq: number;
  }>;

type TwoByTwoData = MosaicDataWithCoverageStatistics &
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
  return (
    <img
      alt="RxC contingency table"
      style={{ height: '100%', width: '100%' }}
      src={mosaic}
    />
  );
}

function ContTableFullscreenComponent(props: VisualizationProps) {
  return <MosaicViz {...props} fullscreen />;
}

function TwoByTwoGridComponent(props: VisualizationProps) {
  return <MosaicViz {...props} fullscreen={false} isTwoByTwo />;
}

function TwoByTwoSelectorComponent() {
  return (
    <img
      alt="2x2 contingency table"
      style={{ height: '100%', width: '100%' }}
      src={contingency}
    />
  );
}

function TwoByTwoFullscreenComponent(props: VisualizationProps) {
  return <MosaicViz {...props} fullscreen isTwoByTwo />;
}

function createDefaultConfig(): MosaicConfig {
  return {};
}

type MosaicConfig = t.TypeOf<typeof MosaicConfig>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
const MosaicConfig = t.partial({
  xAxisVariable: VariableDescriptor,
  yAxisVariable: VariableDescriptor,
  facetVariable: VariableDescriptor,
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
    starredVariables,
    toggleStarredVariable,
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

  // TODO Handle facetVariable
  const handleInputVariableChange = useCallback(
    (
      values: Record<
        string,
        { entityId: string; variableId: string } | undefined
      >
    ) => {
      const { xAxisVariable, yAxisVariable, facetVariable } = values;

      updateVizConfig({
        xAxisVariable,
        yAxisVariable,
        facetVariable,
      });
    },
    [updateVizConfig]
  );

  const findEntityAndVariable = useFindEntityAndVariable(entities);

  // outputEntity for OutputEntityTitle's outputEntity prop and outputEntityId at getRequestParams
  const outputEntity = useFindOutputEntity(
    dataElementDependencyOrder,
    vizConfig,
    'xAxisVariable',
    entities
  );

  const data = usePromise(
    useCallback(async (): Promise<ContTableData | TwoByTwoData | undefined> => {
      const xAxisVariable = findEntityAndVariable(vizConfig.xAxisVariable)
        ?.variable;
      const yAxisVariable = findEntityAndVariable(vizConfig.yAxisVariable)
        ?.variable;
      if (
        vizConfig.xAxisVariable == null ||
        xAxisVariable == null ||
        vizConfig.yAxisVariable == null ||
        yAxisVariable == null
      )
        return undefined;

      if (xAxisVariable === yAxisVariable)
        throw new Error(
          'The X and Y variables must not be the same. Please choose different variables for X and Y.'
        );

      const params = getRequestParams(
        studyId,
        filters ?? [],
        vizConfig.xAxisVariable,
        vizConfig.yAxisVariable,
        // pass outputEntity.id
        outputEntity?.id ?? ''
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
      findEntityAndVariable,
      computation.type,
      isTwoByTwo,
    ])
  );

  const xAxisVariableName = findEntityAndVariable(vizConfig.xAxisVariable)
    ?.variable.displayName;
  const yAxisVariableName = findEntityAndVariable(vizConfig.yAxisVariable)
    ?.variable.displayName;
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
              <th>P-value</th>
              <td>{twoByTwoData?.pValue ?? 'N/A'}</td>
              <td>N/A</td>
            </tr>
            <tr>
              <th>Odds ratio</th>
              <td>{twoByTwoData?.oddsRatio ?? 'N/A'}</td>
              <td>{twoByTwoData?.orInterval ?? 'N/A'}</td>
            </tr>
            <tr>
              <th>Relative risk</th>
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
              <th>P-value</th>
              <td>{contTableData?.pValue ?? 'N/A'}</td>
            </tr>
            <tr>
              <th>Degrees of freedom</th>
              <td>{contTableData?.degreesFreedom ?? 'N/A'}</td>
            </tr>
            <tr>
              <th>Chi-squared</th>
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
        <Tabs
          items={[
            [
              'Mosaic',
              <MosaicPlotWithControls
                data={data.value && !data.pending ? data.value : undefined}
                containerStyles={{
                  width: '750px',
                  height: '450px',
                }}
                independentAxisLabel={xAxisVariableName ?? 'X-axis'}
                dependentAxisLabel={yAxisVariableName ?? 'Y-axis'}
                displayLegend={true}
                interactive
                showSpinner={data.pending}
              />,
            ],
            [
              'Table',
              <ContingencyTable
                data={data.value}
                independentVariable={xAxisVariableName ?? 'X-axis'}
                dependentVariable={yAxisVariableName ?? 'Y-axis'}
              />,
            ],
          ]}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridAutoFlow: 'row',
          gap: '0.75em',
          marginLeft: '3em',
          marginTop: '1.5em',
        }}
      >
        <VariableCoverageTable
          completeCases={data.pending ? undefined : data.value?.completeCases}
          filters={filters}
          outputEntityId={outputEntity?.id}
          variableSpecs={[
            {
              role: 'X-axis',
              required: true,
              display: xAxisVariableName,
              variable: vizConfig.xAxisVariable,
            },
            {
              role: 'Y-axis',
              required: true,
              display: yAxisVariableName,
              variable: vizConfig.yAxisVariable,
            },
          ]}
        />
        {statsTable}
      </div>
    </div>
  ) : (
    // thumbnail/grid view
    <Mosaic
      data={data.value && !data.pending ? data.value : undefined}
      containerStyles={{
        width: '250px',
        height: '150px',
      }}
      spacingOptions={{
        marginTop: 30,
        marginBottom: 20,
        marginLeft: 30,
        marginRight: 20,
      }}
      showColumnLabels={false}
      displayLibraryControls={false}
      displayLegend={false}
      interactive={false}
      independentAxisLabel={''}
      dependentAxisLabel={''}
      showSpinner={data.pending}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {fullscreen && (
        <div style={{ display: 'flex', alignItems: 'center', zIndex: 1 }}>
          <InputVariables
            inputs={[
              {
                name: 'xAxisVariable',
                label: 'X-axis',
              },
              {
                name: 'yAxisVariable',
                label: 'Y-axis',
              },
              {
                name: 'facetVariable',
                label: 'Facet (optional)',
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
            starredVariables={starredVariables}
            toggleStarredVariable={toggleStarredVariable}
          />
        </div>
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

      {fullscreen && (
        <OutputEntityTitle
          entity={outputEntity}
          outputSize={data.pending ? undefined : data.value?.outputSize}
        />
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
        displayLibraryControls={displayLibraryControls}
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
    values: data,
    independentLabels: response.mosaic.data[0].xLabel,
    dependentLabels: response.mosaic.data[0].yLabel[0],
    pValue: response.statsTable[0].pvalue,
    degreesFreedom: response.statsTable[0].degreesFreedom,
    chisq: response.statsTable[0].chisq,
    completeCases: response.completeCasesTable,
    outputSize: response.mosaic.config.completeCases,
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
    values: data,
    independentLabels: response.mosaic.data[0].xLabel,
    dependentLabels: response.mosaic.data[0].yLabel[0],
    pValue: response.statsTable[0].pvalue,
    relativeRisk: response.statsTable[0].relativerisk,
    rrInterval: response.statsTable[0].rrInterval,
    oddsRatio: response.statsTable[0].oddsratio,
    orInterval: response.statsTable[0].orInterval,
    completeCases: response.completeCasesTable,
    outputSize: response.mosaic.config.completeCases,
  };
}

function getRequestParams(
  studyId: string,
  filters: Filter[],
  xAxisVariable: VariableDescriptor,
  yAxisVariable: VariableDescriptor,
  // pass outputEntityId
  outputEntityId: string
): MosaicRequestParams {
  return {
    studyId,
    filters,
    config: {
      // add outputEntityId
      outputEntityId: outputEntityId,
      xAxisVariable: xAxisVariable,
      yAxisVariable: yAxisVariable,
    },
  };
}
