import Banner from '@veupathdb/coreui/dist/components/banners/Banner';
import { getOrElse } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { Decoder } from 'io-ts';
import {
  ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useStudyEntities } from '../../hooks/study';
import { useStudyMetadata } from '../../hooks/workspace';
import { VariablesByInputName } from '../../utils/data-element-constraints';
import { CustomSectionSpec, InputSpec, InputVariables } from './InputVariables';
import { VisualizationProps } from './VisualizationTypes';

type Config = Record<string, unknown>;

export interface StandardPlotProps<T, U> {
  vizConfig: U;
  updateVizConfig: (config: U) => void;
  data?: T;
}

interface StandardVsualizationProps<T, U> {
  /**
   * Describes what inputs the user can configure.
   */
  inputs: InputSpec[];
  /**
   * Determine if the showMissingness toggle should be shown, based on data
   */
  enableShowMissingnessToggle?: (data: T) => boolean;
  /**
   * Custom input selectors
   */
  customInputSections?: CustomSectionSpec[];
  /**
   * `io-ts` configuration `Decoder`
   */
  configDecoder: Decoder<unknown, U>;
  /**
   * Default configuration object, when one is not defined
   */
  defaultConfig: U;
  /**
   * A function that returns the ID of the output entity for the visualization
   */
  outputEntitySelector: (
    selectedVariables: VariablesByInputName
  ) => string | undefined;
  /**
   * Map selected variables to a configuration object
   */
  mapSelectedVariablesToConfig: (
    selectedVariables: VariablesByInputName,
    config: U
  ) => U;
  /**
   * Map configuration object to selected variables
   */
  mapConfigToSelectedVariables: (config: U) => VariablesByInputName;
  /**
   * Map selected variables to a configuration object
   */
  mapShowMissingnessToConfig?: (showMissingness: boolean, config: U) => U;
  /**
   * Map configuration object to selected variables
   */
  mapConfigToShowMissingnes?: (config: U) => boolean;
  /**
   * A function that take a vizConfig object and returns a Promise for data.
   */
  getData: (vizConfig: U) => Promise<T>;
  /**
   * Function to render plot and controls
   */
  plotComponent: ComponentType<StandardPlotProps<T, U>>;
}

interface Props<T, U>
  extends StandardVsualizationProps<T, U>,
    VisualizationProps {}

// 1.

export function StandardVsualization<T, U extends Config>(props: Props<T, U>) {
  const {
    inputs,
    enableShowMissingnessToggle,
    starredVariables,
    toggleStarredVariable,
    customInputSections,
    dataElementConstraints,
    dataElementDependencyOrder,
    outputEntitySelector,
    visualization,
    updateConfiguration,
    getData,
    plotComponent: PlotComponent,
    mapSelectedVariablesToConfig,
    mapConfigToSelectedVariables,
    mapShowMissingnessToConfig,
    mapConfigToShowMissingnes,
    configDecoder,
    defaultConfig,
  } = props;
  const studyMetadata = useStudyMetadata();
  const entities = useStudyEntities(studyMetadata.rootEntity);

  // Get data whenever vizConfig changes
  const [data, setData] = useState<T>();
  const [dataError, setDataError] = useState<unknown>();

  const vizConfig = useMemo(() => {
    return pipe(
      configDecoder.decode(visualization.descriptor.configuration),
      getOrElse((): U => defaultConfig)
    );
  }, [configDecoder, visualization.descriptor.configuration, defaultConfig]);

  const selectedVariables = useMemo(
    () => mapConfigToSelectedVariables(vizConfig),
    [mapConfigToSelectedVariables, vizConfig]
  );

  const showMissingness = mapConfigToShowMissingnes
    ? mapConfigToShowMissingnes(vizConfig)
    : false;

  const setShowMissingness = useCallback(
    (showMissingness: boolean) => {
      if (mapShowMissingnessToConfig) {
        updateConfiguration(
          mapShowMissingnessToConfig(showMissingness, vizConfig)
        );
      }
    },
    [mapShowMissingnessToConfig, updateConfiguration, vizConfig]
  );

  const handleSelectedVariablesChange = useCallback(
    (selectedVariables: VariablesByInputName) => {
      updateConfiguration(
        mapSelectedVariablesToConfig(selectedVariables, vizConfig)
      );
    },
    [mapSelectedVariablesToConfig, updateConfiguration, vizConfig]
  );

  useEffect(() => {
    getData(vizConfig).then(
      (nextData) => {
        setDataError(undefined);
        setData(nextData);
      },
      (error) => {
        setDataError(error);
      }
    );
  }, [getData, vizConfig]);

  // Find output entity.
  const outputEntityId = outputEntitySelector(selectedVariables);
  const outputEntity = entities.find((e) => e.id === outputEntityId);
  return (
    <div>
      {dataError && (
        <Banner
          onClose={() => setDataError(undefined)}
          banner={{
            type: 'danger',
            message: String(dataError),
          }}
        />
      )}
      <InputVariables
        inputs={inputs}
        entities={entities}
        customSections={customInputSections}
        selectedVariables={selectedVariables}
        onChange={handleSelectedVariablesChange}
        constraints={dataElementConstraints}
        dataElementDependencyOrder={dataElementDependencyOrder}
        starredVariables={starredVariables}
        toggleStarredVariable={toggleStarredVariable}
        enableShowMissingnessToggle={
          data && enableShowMissingnessToggle
            ? enableShowMissingnessToggle(data)
            : false
        }
        showMissingness={showMissingness}
        onShowMissingnessChange={setShowMissingness}
        outputEntity={outputEntity}
      />
      <PlotComponent
        vizConfig={vizConfig}
        updateVizConfig={updateConfiguration}
        data={data}
      />
    </div>
  );
}

export function makeStandardVisualizationComponent<T, U extends Config>(
  displayName: string,
  config: StandardVsualizationProps<T, U>
) {
  function StandardVsualizationComponent(props: VisualizationProps) {
    return <StandardVsualization {...props} {...config} />;
  }
  StandardVsualizationComponent.displayName = `StandardVisualization<${displayName}>`;
  return StandardVsualizationComponent;
}
