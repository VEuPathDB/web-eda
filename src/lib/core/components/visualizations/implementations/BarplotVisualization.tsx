// load Barplot component
import Barplot, { BarplotProps } from '@veupathdb/components/lib/plots/Barplot';
import { BarplotData } from '@veupathdb/components/lib/types/plots';
import LabelledGroup from '@veupathdb/components/lib/components/widgets/LabelledGroup';
import RadioButtonGroup from '@veupathdb/components/lib/components/widgets/RadioButtonGroup';
import Switch from '@veupathdb/components/lib/components/widgets/Switch';

import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { getOrElse } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';
import { useCallback, useMemo } from 'react';

// need to set for Barplot
import {
  DataClient,
  BarplotResponse,
  BarplotRequestParams,
} from '../../../api/data-api';

import { usePromise } from '../../../hooks/promise';
import { useFindEntityAndVariable } from '../../../hooks/study';
import { useDataClient, useStudyMetadata } from '../../../hooks/workspace';
import { Filter } from '../../../types/filter';
import { VariableDescriptor } from '../../../types/variable';

import { VariableCoverageTable } from '../../VariableCoverageTable';
import { CoverageStatistics } from '../../../types/visualization';

import { InputVariables } from '../InputVariables';
import { OutputEntityTitle } from '../OutputEntityTitle';
import { VisualizationProps, VisualizationType } from '../VisualizationTypes';

import bar from './selectorIcons/bar.svg';
// import axis label unit util
import { axisLabelWithUnit } from '../../../utils/axis-label-unit';
import {
  grayOutLastSeries,
  vocabularyWithMissingData,
} from '../../../utils/analysis';

export const barplotVisualization: VisualizationType = {
  gridComponent: GridComponent,
  selectorComponent: SelectorComponent,
  fullscreenComponent: FullscreenComponent,
  createDefaultConfig: createDefaultConfig,
};

function GridComponent(props: VisualizationProps) {
  return <BarplotViz {...props} fullscreen={false} />;
}

function SelectorComponent() {
  return (
    <img alt="Bar plot" style={{ height: '100%', width: '100%' }} src={bar} />
  );
}

function FullscreenComponent(props: VisualizationProps) {
  return <BarplotViz {...props} fullscreen />;
}

function createDefaultConfig(): BarplotConfig {
  return {
    dependentAxisLogScale: false,
    valueSpec: 'count',
  };
}

type ValueSpec = t.TypeOf<typeof ValueSpec>;
const ValueSpec = t.keyof({ count: null, proportion: null });

type BarplotConfig = t.TypeOf<typeof BarplotConfig>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
const BarplotConfig = t.intersection([
  t.type({
    dependentAxisLogScale: t.boolean,
    valueSpec: ValueSpec,
  }),
  t.partial({
    xAxisVariable: VariableDescriptor,
    overlayVariable: VariableDescriptor,
    facetVariable: VariableDescriptor,
    showMissingness: t.boolean,
  }),
]);

type Props = VisualizationProps & {
  fullscreen: boolean;
};

function BarplotViz(props: Props) {
  const {
    computation,
    visualization,
    updateVisualization,
    filters,
    fullscreen,
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
      BarplotConfig.decode(visualization.configuration),
      getOrElse((): t.TypeOf<typeof BarplotConfig> => createDefaultConfig())
    );
  }, [visualization.configuration]);

  const updateVizConfig = useCallback(
    (newConfig: Partial<BarplotConfig>) => {
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
      const { xAxisVariable, overlayVariable, facetVariable } = values;
      updateVizConfig({
        xAxisVariable,
        overlayVariable,
        facetVariable,
      });
    },
    [updateVizConfig]
  );

  const onDependentAxisLogScaleChange = useCallback(
    (newState?: boolean) => {
      updateVizConfig({
        dependentAxisLogScale: newState,
      });
    },
    [updateVizConfig]
  );

  const onValueSpecChange = useCallback(
    (newValueSpec: ValueSpec) => {
      updateVizConfig({
        valueSpec: newValueSpec,
      });
    },
    [updateVizConfig]
  );

  const onShowMissingnessChange = useCallback(
    (newState?: boolean) => {
      updateVizConfig({
        showMissingness: newState,
      });
    },
    [updateVizConfig]
  );

  const findEntityAndVariable = useFindEntityAndVariable(entities);
  const { variable, entity, overlayVariable } = useMemo(() => {
    const xAxisVariable = findEntityAndVariable(vizConfig.xAxisVariable);
    const overlayVariable = findEntityAndVariable(vizConfig.overlayVariable);
    return {
      variable: xAxisVariable ? xAxisVariable.variable : undefined,
      entity: xAxisVariable ? xAxisVariable.entity : undefined,
      overlayVariable: overlayVariable ? overlayVariable.variable : undefined,
    };
  }, [
    findEntityAndVariable,
    vizConfig.xAxisVariable,
    vizConfig.overlayVariable,
  ]);

  const data = usePromise(
    useCallback(async (): Promise<any> => {
      if (variable == null) return undefined;

      const params = getRequestParams(studyId, filters ?? [], vizConfig);

      const response = dataClient.getBarplot(
        computation.type,
        params as BarplotRequestParams
      );

      return grayOutLastSeries(
        reorderData(
          barplotResponseToData(await response),
          variable?.vocabulary,
          vocabularyWithMissingData(
            overlayVariable?.vocabulary,
            vizConfig.showMissingness
          )
        ),
        vizConfig.showMissingness
      );
    }, [
      studyId,
      filters,
      dataClient,
      vizConfig.xAxisVariable,
      vizConfig.overlayVariable,
      vizConfig.facetVariable,
      vizConfig.valueSpec,
      vizConfig.showMissingness,
      variable,
      overlayVariable,
      computation.type,
    ])
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {fullscreen && (
        <div style={{ display: 'flex', alignItems: 'center', zIndex: 1 }}>
          <InputVariables
            inputs={[
              {
                name: 'xAxisVariable',
                label: 'Main',
                role: 'primary',
              },
              {
                name: 'overlayVariable',
                label: 'Overlay (optional)',
                role: 'stratification',
              },
            ]}
            entities={entities}
            values={{
              xAxisVariable: vizConfig.xAxisVariable,
              overlayVariable: vizConfig.overlayVariable,
              facetVariable: vizConfig.facetVariable,
            }}
            onChange={handleInputVariableChange}
            constraints={dataElementConstraints}
            dataElementDependencyOrder={dataElementDependencyOrder}
            starredVariables={starredVariables}
            toggleStarredVariable={toggleStarredVariable}
            onShowMissingnessChange={onShowMissingnessChange}
            showMissingness={vizConfig.showMissingness}
            outputEntity={entity}
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
      {fullscreen ? (
        <>
          <OutputEntityTitle
            entity={entity}
            outputSize={data.pending ? undefined : data.value?.outputSize}
          />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
            }}
          >
            <BarplotWithControls
              data={data.value && !data.pending ? data.value : { series: [] }}
              containerStyles={{
                width: '750px',
                height: '450px',
              }}
              orientation={'vertical'}
              barLayout={'group'}
              displayLegend={
                data.value &&
                (data.value.series.length > 1 ||
                  vizConfig.overlayVariable != null)
              }
              independentAxisLabel={axisLabelWithUnit(variable) ?? 'Main'}
              dependentAxisLabel={
                vizConfig.valueSpec === 'count' ? 'Count' : 'Proportion'
              }
              legendTitle={overlayVariable?.displayName}
              interactive
              showSpinner={data.pending}
              valueSpec={vizConfig.valueSpec}
              onValueSpecChange={onValueSpecChange}
              dependentAxisLogScale={vizConfig.dependentAxisLogScale}
              onDependentAxisLogScaleChange={onDependentAxisLogScaleChange}
            />
            <VariableCoverageTable
              completeCases={
                data.pending ? undefined : data.value?.completeCases
              }
              filters={filters}
              outputEntityId={vizConfig.xAxisVariable?.entityId}
              variableSpecs={[
                {
                  role: 'Main',
                  required: true,
                  display: variable?.displayName,
                  variable: vizConfig.xAxisVariable,
                },
                {
                  role: 'Overlay',
                  display: overlayVariable?.displayName,
                  variable: vizConfig.overlayVariable,
                },
              ]}
            />
          </div>
        </>
      ) : (
        // thumbnail/grid view
        <Barplot
          data={data.value && !data.pending ? data.value : { series: [] }}
          containerStyles={{
            width: '230px',
            height: '150px',
          }}
          // check this option (possibly plot control?)
          orientation={'vertical'}
          barLayout={'group'}
          // show/hide independent/dependent axis tick label
          showIndependentAxisTickLabel={false}
          showDependentAxisTickLabel={false}
          // new props for better displaying grid view
          displayLegend={false}
          displayLibraryControls={false}
          interactive={false}
          // set margin for better display at thumbnail/grid view
          spacingOptions={{
            marginLeft: 30,
            marginRight: 20,
            marginBottom: 0,
            marginTop: 20,
          }}
          showSpinner={data.pending}
          dependentAxisLogScale={vizConfig.dependentAxisLogScale}
        />
      )}
    </div>
  );
}

type BarplotWithControlsProps = BarplotProps & {
  dependentAxisLogScale: boolean;
  onDependentAxisLogScaleChange: (newState: boolean) => void;
  valueSpec: ValueSpec;
  onValueSpecChange: (newValueSpec: ValueSpec) => void;
};

function BarplotWithControls({
  data,
  dependentAxisLogScale,
  onDependentAxisLogScaleChange,
  valueSpec,
  onValueSpecChange,
  ...barPlotProps
}: BarplotWithControlsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Barplot
        {...barPlotProps}
        dependentAxisLogScale={dependentAxisLogScale}
        data={data}
        // add controls
        // displayLegend={true}
        displayLibraryControls={false}
      />
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <LabelledGroup label="Y-axis">
          <Switch
            label="Log Scale:"
            state={dependentAxisLogScale}
            onStateChange={onDependentAxisLogScaleChange}
          />
          <RadioButtonGroup
            selectedOption={
              valueSpec === 'proportion' ? 'proportional' : 'count'
            }
            options={['count', 'proportional']}
            onOptionSelected={(newOption) => {
              if (newOption === 'proportional') {
                onValueSpecChange('proportion');
              } else {
                onValueSpecChange('count');
              }
            }}
          />
        </LabelledGroup>
      </div>
    </div>
  );
}

/**
 * Reformat response from Barplot endpoints into complete BarplotData
 * @param response
 * @returns BarplotData & completeCases & outputSize
 */
export function barplotResponseToData(
  response: BarplotResponse
): BarplotData & CoverageStatistics {
  return {
    series: response.barplot.data.map((data, index) => ({
      // name has value if using overlay variable
      name: data.overlayVariableDetails?.value ?? `series ${index}`,
      // color: TO DO
      label: data.label,
      value: data.value,
    })),
    completeCases: response.completeCasesTable,
    outputSize: response.barplot.config.completeCases,
  };
}

function getRequestParams(
  studyId: string,
  filters: Filter[],
  vizConfig: BarplotConfig
): BarplotRequestParams {
  return {
    studyId,
    filters,
    config: {
      // is outputEntityId correct?
      outputEntityId: vizConfig.xAxisVariable!.entityId,
      xAxisVariable: vizConfig.xAxisVariable!,
      overlayVariable: vizConfig.overlayVariable,
      // valueSpec: manually inputted for now
      valueSpec: vizConfig.valueSpec,
      barMode: 'group', // or 'stack'
      showMissingness: vizConfig.showMissingness ? 'TRUE' : 'FALSE',
    },
  } as BarplotRequestParams;
}

/**
 * reorder the series prop of the BarplotData object so that labels
 * go in the same order as the main variable's vocabulary, and the overlay
 * strata are ordered in that variable's vocabulary order too, with missing values and traces added as undefined
 *
 * NOTE: if any values are missing from the vocabulary array, then the data for that value WILL NOT BE PLOTTED
 *
 */
function reorderData(
  data: BarplotData,
  labelVocabulary: string[] = [],
  overlayVocabulary: string[] = []
) {
  const labelOrderedSeries = data.series.map((series) => {
    if (labelVocabulary.length > 0) {
      // for each label in the vocabulary's correct order,
      // find the index of that label in the provided series' label array
      const labelIndices = labelVocabulary.map((label) =>
        series.label.indexOf(label)
      );
      // now return the data from the other array(s) in the same order
      // any missing labels will be mapped to `undefined` (indexing an array with -1)
      return {
        ...series,
        label: labelVocabulary,
        value: labelIndices.map((i) => series.value[i]),
      };
    } else {
      return series;
    }
  });

  if (overlayVocabulary.length > 0) {
    // for each value in the overlay vocabulary's correct order
    // find the index in the series where series.name equals that value
    const overlayValues = labelOrderedSeries.map((series) => series.name);
    const overlayIndices = overlayVocabulary.map((name) =>
      overlayValues.indexOf(name)
    );
    return {
      ...data,
      // return the series in overlay vocabulary order
      series: overlayIndices.map(
        (i, j) =>
          labelOrderedSeries[i] ?? {
            // if there is no series, insert a dummy series
            name: overlayVocabulary[j],
            label: labelVocabulary,
            value: labelVocabulary.map(() => undefined),
          }
      ),
    };
  } else {
    return { ...data, series: labelOrderedSeries };
  }
}
