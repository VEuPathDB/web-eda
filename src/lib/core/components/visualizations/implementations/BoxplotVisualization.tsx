// load Boxplot component
import Boxplot, { BoxplotProps } from '@veupathdb/components/lib/plots/Boxplot';
import FacetedBoxplot from '@veupathdb/components/lib/plots/facetedPlots/FacetedBoxplot';

import * as t from 'io-ts';
import { useCallback, useMemo, useState, useEffect } from 'react';

// need to set for Boxplot
import DataClient, { BoxplotResponse } from '../../../api/DataClient';

import { usePromise } from '../../../hooks/promise';
import {
  useFindEntityAndVariable,
  useStudyEntities,
} from '../../../hooks/workspace';
import { useUpdateThumbnailEffect } from '../../../hooks/thumbnails';
import { useDataClient, useStudyMetadata } from '../../../hooks/workspace';
import { VariableDescriptor } from '../../../types/variable';

import { VariableCoverageTable } from '../../VariableCoverageTable';

import { InputVariables } from '../InputVariables';
import { OutputEntityTitle } from '../OutputEntityTitle';
import {
  ComputedVariableDetails,
  VisualizationProps,
} from '../VisualizationTypes';
import box from './selectorIcons/box.svg';
import {
  BoxplotData as BoxplotSeries,
  FacetedData,
  BoxplotDataObject,
} from '@veupathdb/components/lib/types/plots';
import { CoverageStatistics } from '../../../types/visualization';
import { BirdsEyeView } from '../../BirdsEyeView';
import { PlotLayout } from '../../layouts/PlotLayout';
import PluginError from '../PluginError';

import {
  at,
  groupBy,
  mapValues,
  size,
  head,
  map,
  values,
  keys,
  pick,
} from 'lodash';
// import axis label unit util
import { variableDisplayWithUnit } from '../../../utils/variable-display';
import {
  fixLabelForNumberVariables,
  fixLabelsForNumberVariables,
  grayOutLastSeries,
  nonUniqueWarning,
  hasIncompleteCases,
  variablesAreUnique,
  vocabularyWithMissingData,
  fixVarIdLabels,
} from '../../../utils/visualization';
import { VariablesByInputName } from '../../../utils/data-element-constraints';
import { StudyEntity, Variable } from '../../../types/study';
import { isFaceted } from '@veupathdb/components/lib/types/guards';
// custom legend
import PlotLegend, {
  LegendItemsProps,
} from '@veupathdb/components/lib/components/plotControls/PlotLegend';
import { ColorPaletteDefault } from '@veupathdb/components/lib/types/plots/addOns';
// a custom hook to preserve the status of checked legend items
import { useCheckedLegendItemsStatus } from '../../../hooks/checkedLegendItemsStatus';
import { useVizConfig } from '../../../hooks/visualizations';

// concerning axis range control
import LabelledGroup from '@veupathdb/components/lib/components/widgets/LabelledGroup';
import { NumberOrDateRange, NumberRange } from '../../../types/general';
import { NumberRangeInput } from '@veupathdb/components/lib/components/widgets/NumberAndDateRangeInputs';
// reusable util for computing truncationConfig
import { truncationConfig } from '../../../utils/truncation-config-utils';
// use Notification for truncation warning message
import Notification from '@veupathdb/components/lib/components/widgets//Notification';
import Button from '@veupathdb/components/lib/components/widgets/Button';
import { useDefaultAxisRange } from '../../../hooks/computeDefaultAxisRange';
// alphadiv abundance this should be used for collection variable
import { findEntityAndVariable as findCollectionVariableEntityAndVariable } from '../../../utils/study-metadata';
// type of computedVariableMetadata for computation apps such as alphadiv and abundance
import { ComputedVariableMetadata } from '../../../api/DataClient/types';
import { createVisualizationPlugin } from '../VisualizationPlugin';
import { useFindOutputEntity } from '../../../hooks/findOutputEntity';
import { boxplotDefaultDependentAxisMinMax } from '../../../utils/axis-range-calculations';

type BoxplotData = { series: BoxplotSeries };
// type of computedVariableMetadata for computation apps such as alphadiv and abundance
type BoxplotComputedVariableMetadata = {
  computedVariableMetadata?: ComputedVariableMetadata;
};

// add type of computedVariableMetadata for computation apps such as alphadiv and abundance
export type BoxplotDataWithCoverage = (BoxplotData | FacetedData<BoxplotData>) &
  CoverageStatistics &
  BoxplotComputedVariableMetadata;

const plotContainerStyles = {
  height: 450,
  width: 750,
  marginLeft: '0.75rem',
  border: '1px solid #dedede',
  boxShadow: '1px 1px 4px #00000066',
};

const plotSpacingOptions = {};

const modalPlotContainerStyles = {
  width: '85%',
  height: '100%',
  margin: 'auto',
};

interface Options {
  getXAxisVariable?: (computeConfig: unknown) => VariableDescriptor | undefined;
  getComputedYAxisDetails?: (
    computeConfig: unknown
  ) => ComputedVariableDetails | undefined;
  getPlotSubtitle?: (computeConfig: unknown) => string | undefined;
  hideShowMissingnessToggle?: boolean;
}

export const boxplotVisualization = createVisualizationPlugin({
  selectorIcon: box,
  fullscreenComponent: FullscreenComponent,
  createDefaultConfig: createDefaultConfig,
});

function FullscreenComponent(props: VisualizationProps<Options>) {
  return <BoxplotViz {...props} />;
}

function createDefaultConfig(): BoxplotConfig {
  return {};
}

// export
export type BoxplotConfig = t.TypeOf<typeof BoxplotConfig>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const BoxplotConfig = t.partial({
  xAxisVariable: VariableDescriptor,
  yAxisVariable: VariableDescriptor,
  overlayVariable: VariableDescriptor,
  facetVariable: VariableDescriptor,
  showMissingness: t.boolean,
  // for custom legend: vizconfig.checkedLegendItems
  checkedLegendItems: t.array(t.string),
  // dependent axis range control: NumberRange or NumberOrDateRange
  dependentAxisRange: NumberOrDateRange,
});

function BoxplotViz(props: VisualizationProps<Options>) {
  const {
    computation,
    options,
    visualization,
    updateConfiguration,
    updateThumbnail,
    filters,
    dataElementConstraints,
    dataElementDependencyOrder,
    starredVariables,
    toggleStarredVariable,
    totalCounts,
    filteredCounts,
  } = props;
  const studyMetadata = useStudyMetadata();
  const { id: studyId } = studyMetadata;
  const entities = useStudyEntities();
  const dataClient: DataClient = useDataClient();

  const [vizConfig, updateVizConfig] = useVizConfig(
    visualization.descriptor.configuration,
    BoxplotConfig,
    createDefaultConfig,
    updateConfiguration
  );

  // set the state of truncation warning message
  const [
    truncatedDependentAxisWarning,
    setTruncatedDependentAxisWarning,
  ] = useState<string>('');

  // TODO Handle facetVariable
  const handleInputVariableChange = useCallback(
    (selectedVariables: VariablesByInputName) => {
      const {
        xAxisVariable,
        yAxisVariable,
        overlayVariable,
        facetVariable,
      } = selectedVariables;
      updateVizConfig({
        xAxisVariable,
        yAxisVariable,
        overlayVariable,
        facetVariable,
        // set undefined for variable change
        checkedLegendItems: undefined,
        dependentAxisRange: undefined,
      });
      // close truncation warnings
      setTruncatedDependentAxisWarning('');
    },
    [updateVizConfig]
  );

  const findEntityAndVariable = useFindEntityAndVariable();

  const providedXAxisVariable = options?.getXAxisVariable?.(
    computation.descriptor.configuration
  );
  const computedYAxisDetails = options?.getComputedYAxisDetails?.(
    computation.descriptor.configuration
  );

  const {
    xAxisVariable,
    yAxisVariable,
    overlayVariable,
    overlayEntity,
    facetVariable,
    facetEntity,
  } = useMemo(() => {
    const { variable: xAxisVariable } =
      findEntityAndVariable(vizConfig.xAxisVariable) ?? {};
    const { variable: yAxisVariable } =
      findEntityAndVariable(vizConfig.yAxisVariable) ?? {};
    const { variable: overlayVariable, entity: overlayEntity } =
      findEntityAndVariable(vizConfig.overlayVariable) ?? {};
    const { variable: facetVariable, entity: facetEntity } =
      findEntityAndVariable(vizConfig.facetVariable) ?? {};
    return {
      xAxisVariable,
      yAxisVariable,
      overlayVariable,
      overlayEntity,
      facetVariable,
      facetEntity,
    };
  }, [
    findEntityAndVariable,
    vizConfig.xAxisVariable,
    vizConfig.yAxisVariable,
    vizConfig.overlayVariable,
    vizConfig.facetVariable,
  ]);

  // prettier-ignore
  // allow 2nd parameter of resetCheckedLegendItems for checking legend status
  const onChangeHandlerFactory = useCallback(
    < ValueType,>(key: keyof BoxplotConfig, resetCheckedLegendItems?: boolean, resetAxisRanges?: boolean) => (newValue?: ValueType) => {
      const newPartialConfig = {
        [key]: newValue,
        ...(resetCheckedLegendItems ? { checkedLegendItems: undefined } : {}),
      	...(resetAxisRanges ? { dependentAxisRange: undefined } : {}),
      };
      updateVizConfig(newPartialConfig);
      if (resetAxisRanges)
	      setTruncatedDependentAxisWarning('');
    },
    [updateVizConfig]
  );

  // set checkedLegendItems: undefined for the change of showMissingness
  const onShowMissingnessChange = onChangeHandlerFactory<boolean>(
    'showMissingness',
    true,
    true
  );

  // for custom legend: vizconfig.checkedLegendItems
  const onCheckedLegendItemsChange = onChangeHandlerFactory<string[]>(
    'checkedLegendItems'
  );

  // outputEntity for OutputEntityTitle's outputEntity prop and outputEntityId at getRequestParams
  // Abundance boxplots already know their entity, x, and y vars. If we're in the abundance app, set
  // the output entity here so that the boxplot can appear on load.
  const outputEntity = useFindOutputEntity(
    dataElementDependencyOrder,
    vizConfig,
    'yAxisVariable',
    computedYAxisDetails?.entityId
  );

  // add to support both alphadiv and abundance
  const data = usePromise(
    useCallback(async (): Promise<BoxplotDataWithCoverage | undefined> => {
      if (
        // check for vizConfig variables only if provided variables are not defined.
        (providedXAxisVariable == null &&
          (vizConfig.xAxisVariable == null || xAxisVariable == null)) ||
        (computedYAxisDetails == null &&
          (vizConfig.yAxisVariable == null || yAxisVariable == null)) ||
        outputEntity == null ||
        filteredCounts.pending ||
        filteredCounts.value == null
      )
        return undefined;

      if (
        !variablesAreUnique([
          xAxisVariable,
          yAxisVariable,
          overlayVariable,
          facetVariable,
        ])
      )
        throw new Error(nonUniqueWarning);

      // add visualization.type here. valueSpec too?
      const params = {
        studyId,
        filters,
        config: {
          outputEntityId: outputEntity.id,
          // post options: 'all', 'outliers'
          points: 'outliers',
          mean: 'TRUE',
          xAxisVariable: vizConfig.xAxisVariable,
          yAxisVariable: vizConfig.yAxisVariable,
          overlayVariable: vizConfig.overlayVariable,
          facetVariable: vizConfig.facetVariable
            ? [vizConfig.facetVariable]
            : [],
          showMissingness: vizConfig.showMissingness ? 'TRUE' : 'FALSE',
        },
        computeConfig: computation.descriptor.configuration,
      };

      // boxplot
      const response = await dataClient.getVisualizationData(
        computation.descriptor.type,
        visualization.descriptor.type,
        params,
        BoxplotResponse
      );

      const showMissingOverlay =
        vizConfig.showMissingness &&
        hasIncompleteCases(
          overlayEntity,
          overlayVariable,
          outputEntity,
          filteredCounts.value,
          response.completeCasesTable
        );
      const showMissingFacet =
        vizConfig.showMissingness &&
        hasIncompleteCases(
          facetEntity,
          facetVariable,
          outputEntity,
          filteredCounts.value,
          response.completeCasesTable
        );

      const vocabulary = fixLabelsForNumberVariables(
        xAxisVariable?.vocabulary,
        xAxisVariable
      );
      const overlayVocabulary = fixLabelsForNumberVariables(
        overlayVariable?.vocabulary,
        overlayVariable
      );
      const facetVocabulary = fixLabelsForNumberVariables(
        facetVariable?.vocabulary,
        facetVariable
      );
      return grayOutLastSeries(
        reorderData(
          boxplotResponseToData(
            response,
            xAxisVariable,
            overlayVariable,
            facetVariable,
            computedYAxisDetails,
            entities
          ),
          vocabulary,
          vocabularyWithMissingData(overlayVocabulary, showMissingOverlay),
          vocabularyWithMissingData(facetVocabulary, showMissingFacet),
          entities
        ),
        showMissingOverlay,
        '#a0a0a0'
      );
    }, [
      vizConfig.xAxisVariable,
      vizConfig.yAxisVariable,
      vizConfig.overlayVariable,
      vizConfig.facetVariable,
      vizConfig.showMissingness,
      xAxisVariable,
      computation.descriptor.configuration,
      computation.descriptor.type,
      yAxisVariable,
      outputEntity,
      filteredCounts.pending,
      filteredCounts.value,
      overlayVariable,
      facetVariable,
      studyId,
      filters,
      dataClient,
      visualization.descriptor.type,
      overlayEntity,
      facetEntity,
    ])
  );

  const outputSize =
    (overlayVariable != null || facetVariable != null) &&
    !vizConfig.showMissingness
      ? data.value?.completeCasesAllVars
      : data.value?.completeCasesAxesVars;

  const dependentAxisMinMax = boxplotDefaultDependentAxisMinMax(
    data,
    yAxisVariable,
    data?.value?.computedVariableMetadata
  );

  const defaultDependentAxisRange = useDefaultAxisRange(
    yAxisVariable ?? data?.value?.computedVariableMetadata,
    dependentAxisMinMax?.min,
    undefined, // no minPos needed if no logscale option offered
    dependentAxisMinMax?.max,
    false // never logscale
  ) as NumberRange;

  // custom legend items for checkbox
  const legendItems: LegendItemsProps[] = useMemo(() => {
    const legendData = !isFaceted(data.value)
      ? data.value?.series
      : data.value?.facets.find(
          ({ data }) => data != null && data.series.length > 0
        )?.data?.series;

    return legendData != null
      ? legendData.map((dataItem: BoxplotDataObject, index: number) => {
          return {
            label: dataItem.name ?? '',
            // histogram plot does not have mode, so set to square for now
            marker: 'lightSquareBorder',
            markerColor:
              dataItem.name === 'No data'
                ? // boxplot uses slightly fainted color
                  'rgb(191, 191, 191)' // #bfbfbf
                : ColorPaletteDefault[index],
            // deep comparison is required for faceted plot
            hasData: !isFaceted(data.value) // no faceted plot
              ? dataItem.q1.some((el: number | string) => el != null)
                ? true
                : false
              : data.value?.facets
                  .map((el: { label: string; data?: BoxplotData }) => {
                    // faceted plot: here data.value is full data
                    // need to check whether el.data.series[index] exists
                    return el.data?.series[index]?.q1.some(
                      (el: number | string) => el != null
                    );
                  })
                  .includes(true)
              ? true
              : false,
            group: 1,
            rank: 1,
          };
        })
      : [];
  }, [data]);

  // set checkedLegendItems
  const checkedLegendItems = useCheckedLegendItemsStatus(
    legendItems,
    vizConfig.checkedLegendItems
  );

  // alphadiv abundance findEntityAndVariable does not work properly for collection variable
  const independentAxisEntityAndVariable = useMemo(
    () =>
      findCollectionVariableEntityAndVariable(entities, providedXAxisVariable),
    [entities, providedXAxisVariable]
  );
  const independentAxisLabel =
    independentAxisEntityAndVariable?.variable.displayName ??
    variableDisplayWithUnit(xAxisVariable) ??
    'X-axis';

  const dependentAxisLabel = computedYAxisDetails
    ? data.value?.computedVariableMetadata?.displayName?.[0] ??
      computedYAxisDetails?.placeholderDisplayName
    : variableDisplayWithUnit(yAxisVariable) ?? 'Y-axis';

  const plotNode = (
    <BoxplotWithControls
      // data.value
      data={data.value}
      updateThumbnail={updateThumbnail}
      containerStyles={!isFaceted(data.value) ? plotContainerStyles : undefined}
      spacingOptions={!isFaceted(data.value) ? plotSpacingOptions : undefined}
      orientation={'vertical'}
      displayLegend={false}
      // alphadiv abundance: set a independentAxisLabel condition for abundance
      independentAxisLabel={independentAxisLabel}
      dependentAxisLabel={dependentAxisLabel}
      // show/hide independent/dependent axis tick label
      showIndependentAxisTickLabel={true}
      showDependentAxisTickLabel={true}
      showMean={true}
      interactive={!isFaceted(data.value) ? true : false}
      showSpinner={data.pending || filteredCounts.pending}
      showRawData={true}
      legendTitle={variableDisplayWithUnit(overlayVariable)}
      // for custom legend passing checked state in the  checkbox to PlotlyPlot
      legendItems={legendItems}
      checkedLegendItems={checkedLegendItems}
      onCheckedLegendItemsChange={onCheckedLegendItemsChange}
      // axis range control
      vizConfig={vizConfig}
      updateVizConfig={updateVizConfig}
      // add dependent axis range for better displaying tick labels in log-scale
      defaultDependentAxisRange={defaultDependentAxisRange}
      // no need to pass dependentAxisRange
      // pass useState of truncation warnings
      truncatedDependentAxisWarning={truncatedDependentAxisWarning}
      setTruncatedDependentAxisWarning={setTruncatedDependentAxisWarning}
      dependentAxisMinMax={dependentAxisMinMax}
    />
  );

  const showOverlayLegend =
    vizConfig.overlayVariable != null && legendItems.length > 0;
  const legendNode = legendItems != null && !data.pending && data != null && (
    <PlotLegend
      legendItems={legendItems}
      checkedLegendItems={checkedLegendItems}
      legendTitle={variableDisplayWithUnit(overlayVariable)}
      onCheckedLegendItemsChange={onCheckedLegendItemsChange}
      // add a condition to show legend even for single overlay data and check legendItems exist
      showOverlayLegend={showOverlayLegend}
    />
  );

  // When we only have a computed y axis (and no provided x axis) then the y axis var
  // can have a "normal" variable descriptor. In this case we want the computed y var to act just
  // like any other continuous variable.
  const computedYAxisDescriptor =
    !providedXAxisVariable && computedYAxisDetails
      ? ({
          entityId: computedYAxisDetails?.entityId,
          variableId: computedYAxisDetails?.variableId,
          displayName: data.value?.computedVariableMetadata?.displayName?.[0],
        } as VariableDescriptor)
      : null;

  // List variables in a collection one by one in the variable coverage table. Create these extra rows
  // here and then append to the variable coverage table rows array.
  const additionalVariableCoverageTableRows = data.value
    ?.computedVariableMetadata?.collectionVariable?.collectionVariableDetails
    ? data.value?.computedVariableMetadata?.collectionVariable?.collectionVariableDetails.map(
        (varDetails) => ({
          role: '',
          required: true,
          display: findEntityAndVariable(varDetails)?.variable.displayName,
          variable: varDetails,
        })
      )
    : [];

  const tableGroupNode = (
    <>
      <BirdsEyeView
        completeCasesAllVars={
          data.pending ? undefined : data.value?.completeCasesAllVars
        }
        completeCasesAxesVars={
          data.pending ? undefined : data.value?.completeCasesAxesVars
        }
        outputEntity={outputEntity}
        stratificationIsActive={
          overlayVariable != null || facetVariable != null
        }
        enableSpinner={
          xAxisVariable != null && yAxisVariable != null && !data.error
        }
        totalCounts={totalCounts.value}
        filteredCounts={filteredCounts.value}
      />
      <VariableCoverageTable
        completeCases={data.pending ? undefined : data.value?.completeCases}
        filteredCounts={filteredCounts}
        outputEntityId={outputEntity?.id}
        variableSpecs={[
          {
            role: 'X-axis',
            required: true,
            display: independentAxisLabel,
            variable: providedXAxisVariable ?? vizConfig.xAxisVariable,
          },
          ...additionalVariableCoverageTableRows,
          {
            role: 'Y-axis',
            required: !providedXAxisVariable,
            display: dependentAxisLabel,
            variable: computedYAxisDescriptor ?? vizConfig.yAxisVariable,
          },
          {
            role: 'Overlay',
            display: variableDisplayWithUnit(overlayVariable),
            variable: vizConfig.overlayVariable,
          },
          {
            role: 'Facet',
            display: variableDisplayWithUnit(facetVariable),
            variable: vizConfig.facetVariable,
          },
        ]}
      />
    </>
  );

  // plot subtitle
  const plotSubtitle = options?.getPlotSubtitle?.(
    computation.descriptor.configuration
  );

  const areRequiredInputsSelected = useMemo(() => {
    if (!dataElementConstraints) return false;
    return Object.entries(dataElementConstraints[0])
      .filter((variable) => variable[1].isRequired)
      .every((reqdVar) => !!(vizConfig as any)[reqdVar[0]]);
  }, [
    dataElementConstraints,
    vizConfig.xAxisVariable,
    vizConfig.yAxisVariable,
  ]);

  // for handling alphadiv abundance
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', zIndex: 1 }}>
        <InputVariables
          inputs={[
            {
              name: 'xAxisVariable',
              label: 'X-axis',
              role: 'axis',
              readonlyValue: providedXAxisVariable && independentAxisLabel,
            },
            {
              name: 'yAxisVariable',
              label: 'Y-axis',
              role: 'axis',
              readonlyValue: computedYAxisDetails && dependentAxisLabel,
            },
            {
              name: 'overlayVariable',
              label: 'Overlay',
              role: 'stratification',
            },
            {
              name: 'facetVariable',
              label: 'Facet',
              role: 'stratification',
            },
          ]}
          entities={entities}
          selectedVariables={{
            xAxisVariable: vizConfig.xAxisVariable,
            yAxisVariable: vizConfig.yAxisVariable,
            overlayVariable: vizConfig.overlayVariable,
            facetVariable: vizConfig.facetVariable,
          }}
          onChange={handleInputVariableChange}
          constraints={dataElementConstraints}
          dataElementDependencyOrder={dataElementDependencyOrder}
          starredVariables={starredVariables}
          toggleStarredVariable={toggleStarredVariable}
          enableShowMissingnessToggle={
            (overlayVariable != null || facetVariable != null) &&
            data.value?.completeCasesAllVars !==
              data.value?.completeCasesAxesVars
          }
          showMissingness={vizConfig.showMissingness}
          // this can be used to show and hide no data control
          onShowMissingnessChange={
            options?.hideShowMissingnessToggle
              ? undefined
              : onShowMissingnessChange
          }
          outputEntity={outputEntity}
        />
      </div>

      <PluginError error={data.error} outputSize={outputSize} />
      <OutputEntityTitle
        entity={outputEntity}
        outputSize={outputSize}
        subtitle={plotSubtitle}
      />
      <PlotLayout
        isFaceted={isFaceted(data.value)}
        legendNode={showOverlayLegend ? legendNode : null}
        plotNode={plotNode}
        tableGroupNode={tableGroupNode}
        showRequiredInputsPrompt={!areRequiredInputsSelected}
      />
    </div>
  );
}

type BoxplotWithControlsProps = Omit<BoxplotProps, 'data'> & {
  data?: BoxplotDataWithCoverage;
  updateThumbnail: (src: string) => void;
  // add props for custom legend
  legendItems: LegendItemsProps[];
  checkedLegendItems: string[] | undefined;
  onCheckedLegendItemsChange: (checkedLegendItems: string[]) => void;
  // define types for axis range control
  vizConfig: BoxplotConfig;
  updateVizConfig: (newConfig: Partial<BoxplotConfig>) => void;
  defaultDependentAxisRange: NumberRange | undefined;
  // pass useState of truncation warnings
  truncatedDependentAxisWarning: string;
  setTruncatedDependentAxisWarning: (
    truncatedDependentAxisWarning: string
  ) => void;
  dependentAxisMinMax: NumberRange | undefined;
};

function BoxplotWithControls({
  data,
  updateThumbnail,
  // add props for custom legend
  legendItems,
  checkedLegendItems,
  onCheckedLegendItemsChange,
  // for axis range control
  vizConfig,
  updateVizConfig,
  defaultDependentAxisRange,
  // pass useState of truncation warnings
  truncatedDependentAxisWarning,
  setTruncatedDependentAxisWarning,
  dependentAxisMinMax,
  ...boxplotComponentProps
}: BoxplotWithControlsProps) {
  const plotRef = useUpdateThumbnailEffect(
    updateThumbnail,
    plotContainerStyles,
    [data, checkedLegendItems, vizConfig.dependentAxisRange]
  );

  // axis range control
  const handleDependentAxisRangeChange = useCallback(
    (newRange?: NumberRange) => {
      updateVizConfig({
        dependentAxisRange: newRange,
      });
    },
    [updateVizConfig]
  );

  const handleDependentAxisSettingsReset = useCallback(() => {
    updateVizConfig({
      dependentAxisRange: undefined,
    });
    // add reset for truncation message as well
    setTruncatedDependentAxisWarning('');
  }, [updateVizConfig, setTruncatedDependentAxisWarning]);

  // set truncation flags: will see if this is reusable with other application
  const {
    truncationConfigIndependentAxisMin,
    truncationConfigIndependentAxisMax,
    truncationConfigDependentAxisMin,
    truncationConfigDependentAxisMax,
  } = useMemo(
    () =>
      truncationConfig({ dependentAxisRange: dependentAxisMinMax }, vizConfig),
    [dependentAxisMinMax, vizConfig.dependentAxisRange]
  );

  useEffect(() => {
    if (truncationConfigDependentAxisMin || truncationConfigDependentAxisMax) {
      setTruncatedDependentAxisWarning(
        'Data may have been truncated by range selection, as indicated by the yellow shading'
      );
    }
  }, [
    truncationConfigDependentAxisMin,
    truncationConfigDependentAxisMax,
    setTruncatedDependentAxisWarning,
  ]);

  // send boxplotComponentProps with axisTruncationConfig
  const boxplotFacetProps = {
    ...boxplotComponentProps,
    dependentAxisRange:
      vizConfig.dependentAxisRange ?? defaultDependentAxisRange,
    // pass axisTruncationConfig to faceted plot
    axisTruncationConfig: {
      independentAxis: {
        min: truncationConfigIndependentAxisMin,
        max: truncationConfigIndependentAxisMax,
      },
      dependentAxis: {
        min: truncationConfigDependentAxisMin,
        max: truncationConfigDependentAxisMax,
      },
    },
  };

  // TO DO: standardise web-components/BoxplotData to have `series` key
  return (
    <>
      {isFaceted(data) ? (
        <FacetedBoxplot
          data={{
            ...data,
            facets: data.facets.map(({ label, data }) => ({
              label,
              data: data?.series,
            })),
          }}
          // pass boxplotFacetProps
          componentProps={boxplotFacetProps}
          modalComponentProps={{
            independentAxisLabel: boxplotComponentProps.independentAxisLabel,
            dependentAxisLabel: boxplotComponentProps.dependentAxisLabel,
            displayLegend: boxplotComponentProps.displayLegend,
            containerStyles: modalPlotContainerStyles,
          }}
          facetedPlotRef={plotRef}
          // for custom legend: pass checkedLegendItems to PlotlyPlot
          checkedLegendItems={checkedLegendItems}
        />
      ) : (
        <Boxplot
          data={data?.series}
          ref={plotRef}
          // for custom legend: pass checkedLegendItems to PlotlyPlot
          checkedLegendItems={checkedLegendItems}
          dependentAxisRange={
            vizConfig.dependentAxisRange ?? defaultDependentAxisRange
          }
          // pass axisTruncationConfig
          axisTruncationConfig={{
            independentAxis: {
              min: truncationConfigIndependentAxisMin,
              max: truncationConfigIndependentAxisMax,
            },
            dependentAxis: {
              min: truncationConfigDependentAxisMin,
              max: truncationConfigDependentAxisMax,
            },
          }}
          {...boxplotComponentProps}
        />
      )}
      {/* Y-axis range control */}
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <LabelledGroup label="Y-axis controls">
          {/* Y-axis range control */}
          <NumberRangeInput
            label="Range"
            // add range: for now, handle number only
            range={
              (vizConfig.dependentAxisRange as NumberRange) ??
              defaultDependentAxisRange
            }
            onRangeChange={(newRange?: NumberOrDateRange) => {
              handleDependentAxisRangeChange(newRange as NumberRange);
            }}
            allowPartialRange={false}
            // set maxWidth
            containerStyles={{ maxWidth: '350px' }}
          />
          {/* truncation notification */}
          {truncatedDependentAxisWarning ? (
            <Notification
              title={''}
              text={truncatedDependentAxisWarning}
              // this was defined as LIGHT_BLUE
              color={'#5586BE'}
              onAcknowledgement={() => {
                setTruncatedDependentAxisWarning('');
              }}
              showWarningIcon={true}
              // change maxWidth
              containerStyles={{ maxWidth: '350px' }}
            />
          ) : null}
          <Button
            type={'outlined'}
            text={'Reset to defaults'}
            onClick={handleDependentAxisSettingsReset}
            containerStyles={{
              paddingTop: '1.0em',
              width: '50%',
              float: 'right',
            }}
          />
        </LabelledGroup>
      </div>
    </>
  );
}

/**
 * Reformat response from Box Plot endpoints into complete PromiseBoxplotData
 * @param response
 * @returns PromiseBoxplotData
 */
export function boxplotResponseToData(
  response: BoxplotResponse,
  // alphadiv abundance: change variable to be possibly undefined for abundance case
  variable?: Variable,
  overlayVariable?: Variable,
  facetVariable?: Variable,
  computedVariableDetails?: ComputedVariableDetails,
  entities?: StudyEntity[]
): BoxplotDataWithCoverage {
  // group by facet variable value (if only one facet variable in response - there may be up to two in future)
  const facetGroupedResponseData = groupBy(response.boxplot.data, (data) =>
    data.facetVariableDetails && data.facetVariableDetails.length === 1
      ? fixLabelForNumberVariables(
          data.facetVariableDetails[0].value,
          facetVariable
        )
      : '__NO_FACET__'
  );

  // process data and overlay value within each facet grouping
  const processedData = mapValues(facetGroupedResponseData, (group) => {
    const facetIsEmpty = group.every(
      (data) => data.label.length === 0 && data.median.length === 0
    );
    return facetIsEmpty
      ? { series: [] }
      : {
          series: group.map((data) => ({
            lowerfence: data.lowerfence,
            upperfence: data.upperfence,
            q1: data.q1,
            q3: data.q3,
            median: data.median,
            mean: data.mean,
            // correct the {} from back end into []
            outliers: data.outliers
              ? data.outliers.map((x: number[] | {}) =>
                  Array.isArray(x) ? x : []
                )
              : undefined,
            // currently returns seriesX and seriesY for points: 'all' option
            // it is necessary to rely on rawData (or seriesX/Y) for boxplot if points: 'all'
            rawData: data.rawData ? data.rawData : undefined,
            // this will be used as legend
            name:
              data.overlayVariableDetails?.value != null
                ? fixLabelForNumberVariables(
                    data.overlayVariableDetails.value,
                    overlayVariable
                  )
                : '',
            label:
              computedVariableDetails &&
              entities &&
              response.boxplot.config.computedVariableMetadata
                ?.collectionVariable?.collectionVariableDetails
                ? // abundance box labels are variableIds. Need to replace with that variable's display name
                  fixVarIdLabels(
                    data.label,
                    response.boxplot.config.computedVariableMetadata
                      ?.collectionVariable?.collectionVariableDetails,
                    entities
                  )
                : fixLabelsForNumberVariables(data.label, variable),
          })),
        };
  });

  return {
    // data
    ...(size(processedData) === 1 &&
    head(keys(processedData)) === '__NO_FACET__'
      ? // unfaceted
        head(values(processedData))
      : // faceted
        {
          facets: map(processedData, (value, key) => ({
            label: key,
            data: value,
          })),
        }),

    // CoverageStatistics
    completeCases: response.completeCasesTable,
    completeCasesAllVars: response.boxplot.config.completeCasesAllVars,
    completeCasesAxesVars: response.boxplot.config.completeCasesAxesVars,
    // config.computedVariableMetadata should also be returned
    computedVariableMetadata: response.boxplot.config.computedVariableMetadata,
  } as BoxplotDataWithCoverage;
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
  data: BoxplotDataWithCoverage | BoxplotData,
  labelVocabulary: string[] = [],
  overlayVocabulary: string[] = [],
  facetVocabulary: string[] = [],
  entities?: StudyEntity[]
): BoxplotDataWithCoverage | BoxplotData {
  if ('computedVariableMetadata' in data) {
    // If we're returning a list of vars within computedVariableMetadata, then we need to respect that ordering
    if (
      data.computedVariableMetadata?.collectionVariable
        ?.collectionVariableDetails &&
      entities
    ) {
      const rawLabels = data.computedVariableMetadata?.collectionVariable?.collectionVariableDetails?.map(
        (variable) => variable.variableId
      );
      labelVocabulary = fixVarIdLabels(
        rawLabels,
        data.computedVariableMetadata?.collectionVariable
          ?.collectionVariableDetails,
        entities
      );
    }
  }

  if (isFaceted(data)) {
    if (facetVocabulary.length === 0) return data; // FIX-ME stop-gap for vocabulary-less numeric variables

    // for each value in the facet vocabulary's correct order
    // find the index in the series where series.name equals that value
    const facetValues = data.facets.map((facet) => facet.label);
    const facetIndices = facetVocabulary.map((name) =>
      facetValues.indexOf(name)
    );

    // reorder within each facet with call to this function
    return {
      ...data,
      facets: facetIndices.map((i, j) => {
        const facetData = data.facets[i]?.data;
        return {
          label: facetVocabulary[j],
          data:
            facetData != null
              ? (reorderData(
                  facetData,
                  labelVocabulary,
                  overlayVocabulary
                ) as BoxplotData)
              : undefined,
        };
      }),
    };
  }

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
        q1: dice(series.q1, labelIndices),
        q3: dice(series.q3, labelIndices),
        median: dice(series.median, labelIndices),
        ...(series.lowerfence != null
          ? { lowerfence: dice(series.lowerfence, labelIndices) }
          : {}),
        ...(series.upperfence != null
          ? { upperfence: dice(series.upperfence, labelIndices) }
          : {}),
        ...(series.mean ? { mean: dice(series.mean, labelIndices) } : {}),
        ...(series.rawData
          ? { rawData: dice2d(series.rawData, labelIndices) }
          : {}),
        ...(series.outliers
          ? { outliers: dice2d(series.outliers, labelIndices) }
          : {}),
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
            median: labelVocabulary.map(() => undefined),
            q1: labelVocabulary.map(() => undefined),
            q3: labelVocabulary.map(() => undefined),
          }
      ),
    };
  } else {
    return { ...data, series: labelOrderedSeries };
  }
}

/**
 * dice(inArray, indices)
 *
 * lodash.at() wrapped in some TS that preserves the input type on the output (and ensures the result is not `(string | number)[]`)
 *
 * returns an array of elements of `inArray` in the order of the `indices` given
 *
 */
function dice<T extends number[] | string[]>(inArray: T, indices: number[]): T {
  return at(inArray, indices) as T;
}

/**
 * dice2d(inArray, indices)
 *
 * lodash.at() wrapped in some TS that preserves the input type on the output (and ensures the result is not `(string | number)[]`)
 *
 * returns an array of elements of `inArray` in the order of the `indices` given
 *
 * undefined elements are replaced with an empty array
 */
function dice2d<T extends number[][] | string[][]>(
  inArray: T,
  indices: number[]
): T {
  return at(inArray, indices).map((x) => x ?? []) as T;
}
