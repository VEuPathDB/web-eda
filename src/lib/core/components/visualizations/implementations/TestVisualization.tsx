import {
  boolean,
  number,
  record,
  string,
  type,
  TypeOf,
  undefined,
  union,
} from 'io-ts';
import {
  makeStandardVisualizationComponent,
  StandardPlotProps,
} from '../StandardVisualization';
import { VisualizationType } from '../VisualizationTypes';

function SelectorComponent() {
  return <div>Test in selector</div>;
}

const Config = type({
  count: number,
  showMissingness: boolean,
  inputs: record(
    string,
    union([type({ entityId: string, variableId: string }), undefined])
  ),
});

// eslint-disable-next-line @typescript-eslint/no-redeclare
type Config = TypeOf<typeof Config>;

function TestPlotComponent(props: StandardPlotProps<number, Config>) {
  const { vizConfig, updateVizConfig, data } = props;
  function updateCountBy(delta: number) {
    updateVizConfig({ ...vizConfig, count: vizConfig.count + delta });
  }
  return (
    <div>
      <pre>{JSON.stringify(vizConfig)}</pre>
      Count: {data} &nbsp;
      <button type="button" onClick={() => updateCountBy(-1)}>
        -
      </button>
      <button type="button" onClick={() => updateCountBy(1)}>
        +
      </button>
    </div>
  );
}

const FullscreenComponent = makeStandardVisualizationComponent('Test', {
  configDecoder: type({
    count: number,
    showMissingness: boolean,
    inputs: record(
      string,
      union([type({ entityId: string, variableId: string }), undefined])
    ),
  }),
  defaultConfig: {
    count: 0,
    inputs: {},
    showMissingness: false,
  },
  inputs: [
    {
      name: 'xAxisVariable',
      label: 'X-axis',
      role: 'axis',
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
  ],
  enableShowMissingnessToggle: (data) => data % 2 === 0,
  outputEntitySelector: (selectedVariables) =>
    selectedVariables.xAxisVariable?.entityId,
  mapConfigToSelectedVariables: (config) => config.inputs,
  mapSelectedVariablesToConfig: (inputs, config) => ({ ...config, inputs }),
  mapShowMissingnessToConfig: (showMissingness, config) => ({
    ...config,
    showMissingness,
  }),
  mapConfigToShowMissingnes: (config) => config.showMissingness,
  getData: async (config) => config.count,
  plotComponent: TestPlotComponent,
});

export const testVisualization: VisualizationType = {
  selectorComponent: SelectorComponent,
  fullscreenComponent: FullscreenComponent,
  createDefaultConfig: () => ({}),
};
