import Banner from '@veupathdb/coreui/dist/components/banners/Banner';
import { getOrElse } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { Decoder } from 'io-ts';
import {
  ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  outputEntitySelector: (selectedVariables: VariablesByInputName) => string;
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
    configDecoder,
    defaultConfig,
  } = props;
  const studyMetadata = useStudyMetadata();
  const entities = useStudyEntities(studyMetadata.rootEntity);

  const [showMissingness, setShowMissingness] = useState(false);

  // useEffect(() => {
  //   const partialConfig = mapInputsToConfig(selectedVariables);
  //   updateConfiguration({ ...visualization.descriptor.configuration, ...partialConfig });
  // }, [mapInputsToConfig, selectedVariables, updateConfiguration, visualization.descriptor.configuration]);

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

  const handleSelectedVariablesChange = useCallback(
    (selectedVariables: VariablesByInputName) => {
      updateConfiguration(
        mapSelectedVariablesToConfig(selectedVariables, vizConfig)
      );
    },
    [mapSelectedVariablesToConfig, updateConfiguration, vizConfig]
  );

  const getDataRef = useRef(getData);
  useEffect(() => {
    getDataRef.current = getData;
  }, [getData]);

  useEffect(() => {
    getDataRef.current(vizConfig).then(
      (nextData) => {
        setDataError(undefined);
        setData(nextData);
      },
      (error) => {
        setDataError(error);
      }
    );
  }, [vizConfig]);

  // FIXME This is derived from data
  // See https://github.com/VEuPathDB/web-eda/issues/580#issuecomment-1104362246
  const enableShowMissingnessToggle = true;

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
        enableShowMissingnessToggle={enableShowMissingnessToggle}
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
