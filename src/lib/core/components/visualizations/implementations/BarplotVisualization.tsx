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
import { useCallback, useEffect, useMemo, useRef } from 'react';
import PluginError from '../PluginError';

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
import { Variable } from '../../../types/study';
import { VariableDescriptor } from '../../../types/variable';

import { VariableCoverageTable } from '../../VariableCoverageTable';
import { CoverageStatistics } from '../../../types/visualization';
import { BirdsEyeView } from '../../BirdsEyeView';

import { InputVariables } from '../InputVariables';
import { OutputEntityTitle } from '../OutputEntityTitle';
import { VisualizationProps, VisualizationType } from '../VisualizationTypes';

import bar from './selectorIcons/bar.svg';
// import axis label unit util
import { axisLabelWithUnit } from '../../../utils/axis-label-unit';
import {
  fixLabelForNumberVariables,
  fixLabelsForNumberVariables,
  grayOutLastSeries,
  omitEmptyNoDataSeries,
  vocabularyWithMissingData,
} from '../../../utils/analysis';
import { PlotRef } from '@veupathdb/components/lib/plots/PlotlyPlot';
import { VariablesByInputName } from '../../../utils/data-element-constraints';
// use lodash instead of Math.min/max
import { max } from 'lodash';

const plotDimensions = {
  height: 450,
  width: 750,
};

export const barplotVisualization: VisualizationType = {
  selectorComponent: SelectorComponent,
  fullscreenComponent: FullscreenComponent,
  createDefaultConfig: createDefaultConfig,
};

function SelectorComponent() {
  return (
    <img alt="Bar plot" style={{ height: '100%', width: '100%' }} src={bar} />
  );
}

function FullscreenComponent(props: VisualizationProps) {
  return <BarplotViz {...props} />;
}

function createDefaultConfig(): BarplotConfig {
  return {
    dependentAxisLogScale: false,
    valueSpec: 'count',
  };
}

type ValueSpec = t.TypeOf<typeof ValueSpec>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
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

function BarplotViz(props: VisualizationProps) {
  const {
    computation,
    visualization,
    updateConfiguration,
    updateThumbnail,
    filters,
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
      BarplotConfig.decode(visualization.descriptor.configuration),
      getOrElse((): t.TypeOf<typeof BarplotConfig> => createDefaultConfig())
    );
  }, [visualization.descriptor.configuration]);

  const updateVizConfig = useCallback(
    (newConfig: Partial<BarplotConfig>) => {
      updateConfiguration({ ...vizConfig, ...newConfig });
    },
    [updateConfiguration, vizConfig]
  );

  // TODO Handle facetVariable
  const handleInputVariableChange = useCallback(
    (selectedVariables: VariablesByInputName) => {
      const {
        xAxisVariable,
        overlayVariable,
        facetVariable,
      } = selectedVariables;
      updateVizConfig({
        xAxisVariable,
        overlayVariable,
        facetVariable,
      });
    },
    [updateVizConfig]
  );

  // prettier-ignore
  const onChangeHandlerFactory = useCallback(
    < ValueType,>(key: keyof BarplotConfig) => (newValue?: ValueType) => {
      updateVizConfig({
        [key]: newValue,
      });
    },
    [updateVizConfig]
  );
  const onDependentAxisLogScaleChange = onChangeHandlerFactory<boolean>(
    'dependentAxisLogScale'
  );
  const onValueSpecChange = onChangeHandlerFactory<ValueSpec>('valueSpec');
  const onShowMissingnessChange = onChangeHandlerFactory<boolean>(
    'showMissingness'
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
    useCallback(async (): Promise<
      (BarplotData & CoverageStatistics) | undefined
    > => {
      if (variable == null) return undefined;

      if (variable === overlayVariable)
        throw new Error(
          'The X and Overlay variables must not be the same. Please choose different variables for X and Overlay.'
        );
      const params = getRequestParams(studyId, filters ?? [], vizConfig);

      const response = dataClient.getBarplot(
        computation.descriptor.type,
        params as BarplotRequestParams
      );

      const showMissing = vizConfig.showMissingness && overlayVariable != null;
      const vocabulary = fixLabelsForNumberVariables(
        variable?.vocabulary,
        variable
      );
      const overlayVocabulary = fixLabelsForNumberVariables(
        overlayVariable?.vocabulary,
        overlayVariable
      );
      return omitEmptyNoDataSeries(
        grayOutLastSeries(
          reorderData(
            barplotResponseToData(await response, variable, overlayVariable),
            vocabulary,
            vocabularyWithMissingData(overlayVocabulary, showMissing)
          ),
          showMissing
        ),
        showMissing
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
      computation.descriptor.type,
    ])
  );

  const outputSize =
    overlayVariable != null && !vizConfig.showMissingness
      ? data.value?.completeCasesAllVars
      : data.value?.completeCasesAxesVars;

  // find dependent axis max value
  const defaultDependentMaxValue = useMemo(() => {
    return data?.value?.series != null
      ? max(data?.value?.series.flatMap((o) => o.value))
      : undefined;
  }, [data]);

  // set min/max
  const dependentAxisRange =
    defaultDependentMaxValue != null
      ? {
          // set min as 0 (count, proportion) or 0.001 (proportion log scale)
          min:
            vizConfig.valueSpec === 'count'
              ? 0
              : vizConfig.dependentAxisLogScale
              ? 0.001
              : 0,
          // add 5 % margin
          max: defaultDependentMaxValue * 1.05,
        }
      : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
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
              label: 'Overlay',
              role: 'stratification',
            },
          ]}
          entities={entities}
          selectedVariables={{
            xAxisVariable: vizConfig.xAxisVariable,
            overlayVariable: vizConfig.overlayVariable,
            facetVariable: vizConfig.facetVariable,
          }}
          onChange={handleInputVariableChange}
          constraints={dataElementConstraints}
          dataElementDependencyOrder={dataElementDependencyOrder}
          starredVariables={starredVariables}
          enableShowMissingnessToggle={
            overlayVariable != null &&
            data.value?.completeCasesAllVars !==
              data.value?.completeCasesAxesVars
          }
          toggleStarredVariable={toggleStarredVariable}
          onShowMissingnessChange={onShowMissingnessChange}
          showMissingness={vizConfig.showMissingness}
          outputEntity={entity}
        />
      </div>

      <PluginError error={data.error} outputSize={outputSize} />
      <OutputEntityTitle entity={entity} outputSize={outputSize} />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <BarplotWithControls
          data={data.value && !data.pending ? data.value : undefined}
          containerStyles={plotDimensions}
          orientation={'vertical'}
          barLayout={'group'}
          displayLegend={
            data.value &&
            (data.value.series.length > 1 || vizConfig.overlayVariable != null)
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
          updateThumbnail={updateThumbnail}
          dependentAxisLogScale={vizConfig.dependentAxisLogScale}
          onDependentAxisLogScaleChange={onDependentAxisLogScaleChange}
          // set dependent axis range for log scale
          dependentAxisRange={dependentAxisRange}
        />
        <div className="viz-plot-info">
          <BirdsEyeView
            completeCasesAllVars={
              data.pending ? undefined : data.value?.completeCasesAllVars
            }
            completeCasesAxesVars={
              data.pending ? undefined : data.value?.completeCasesAxesVars
            }
            filters={filters}
            outputEntity={entity}
            stratificationIsActive={overlayVariable != null}
            enableSpinner={vizConfig.xAxisVariable != null && !data.error}
          />
          <VariableCoverageTable
            completeCases={data.pending ? undefined : data.value?.completeCases}
            filters={filters}
            outputEntityId={vizConfig.xAxisVariable?.entityId}
            variableSpecs={[
              {
                role: 'Main',
                required: true,
                display: axisLabelWithUnit(variable),
                variable: vizConfig.xAxisVariable,
              },
              {
                role: 'Overlay',
                display: axisLabelWithUnit(overlayVariable),
                variable: vizConfig.overlayVariable,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

type BarplotWithControlsProps = BarplotProps & {
  dependentAxisLogScale: boolean;
  onDependentAxisLogScaleChange: (newState: boolean) => void;
  valueSpec: ValueSpec;
  onValueSpecChange: (newValueSpec: ValueSpec) => void;
  updateThumbnail: (src: string) => void;
};

function BarplotWithControls({
  data,
  dependentAxisLogScale,
  onDependentAxisLogScaleChange,
  valueSpec,
  onValueSpecChange,
  updateThumbnail,
  ...barPlotProps
}: BarplotWithControlsProps) {
  const plotRef = useRef<PlotRef>(null);

  const updateThumbnailRef = useRef(updateThumbnail);
  useEffect(() => {
    updateThumbnailRef.current = updateThumbnail;
  });

  useEffect(() => {
    plotRef.current
      ?.toImage({ format: 'svg', ...plotDimensions })
      .then(updateThumbnailRef.current);
  }, [data, dependentAxisLogScale]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Barplot
        {...barPlotProps}
        ref={plotRef}
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
            selectedOption={valueSpec}
            options={['count', 'proportion']}
            onOptionSelected={(newOption) => {
              if (newOption === 'proportion') {
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
 * @returns BarplotData & completeCases & completeCasesAllVars & completeCasesAxesVars
 */
export function barplotResponseToData(
  response: BarplotResponse,
  variable: Variable,
  overlayVariable?: Variable
): BarplotData & CoverageStatistics {
  const responseIsEmpty = response.barplot.data.every(
    (data) => data.label.length === 0 && data.value.length === 0
  );
  return {
    series: responseIsEmpty
      ? []
      : response.barplot.data.map((data, index) => ({
          // name has value if using overlay variable
          name:
            data.overlayVariableDetails?.value != null
              ? fixLabelForNumberVariables(
                  data.overlayVariableDetails.value,
                  overlayVariable
                )
              : `series ${index}`,
          label: fixLabelsForNumberVariables(data.label, variable),
          value: data.value,
        })),
    completeCases: response.completeCasesTable,
    completeCasesAllVars: response.barplot.config.completeCasesAllVars,
    completeCasesAxesVars: response.barplot.config.completeCasesAxesVars,
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
  data: BarplotData & CoverageStatistics,
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
