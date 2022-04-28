import { getOrElse } from 'fp-ts/lib/Either';
import { number, record, string, type, TypeOf, undefined, union } from 'io-ts';
import { capitalize, words } from 'lodash';
import { useCallback, useMemo } from 'react';
import { VariablesByInputName } from '../../../utils/data-element-constraints';
import {
  StandardPlotProps,
  StandardVsualization,
} from '../StandardVisualization';
import { VisualizationProps, VisualizationType } from '../VisualizationTypes';

export const testVisualization: VisualizationType = {
  selectorComponent: SelectorComponent,
  fullscreenComponent: FullscreenComponent,
  createDefaultConfig: () => ({}),
};

function SelectorComponent() {
  return <div>Test in selector</div>;
}

const Config = type({
  count: number,
  inputs: record(
    string,
    union([type({ entityId: string, variableId: string }), undefined])
  ),
});

// eslint-disable-next-line @typescript-eslint/no-redeclare
type Config = TypeOf<typeof Config>;

const defaultConfig: Config = {
  count: 0,
  inputs: {},
};

async function getData(config: Config) {
  console.log('get data');
  return config.count;
}

function mapSelectedVariablesToConfig(
  selectedVariables: VariablesByInputName,
  config: Config
): Config {
  return {
    ...config,
    inputs: selectedVariables,
  };
}

function mapConfigToSelectedVariables(config: Config) {
  return config.inputs;
}

function outputEntitySelector() {
  return 'foo';
}

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

function FullscreenComponent(props: VisualizationProps) {
  const inputs = useMemo(() => {
    return (
      props.dataElementDependencyOrder?.map((name) => ({
        name,
        label: words(name.replace('Variable', '')).map(capitalize).join('-'),
      })) ?? []
    );
  }, [props.dataElementDependencyOrder]);
  return (
    <StandardVsualization
      {...props}
      configDecoder={Config}
      defaultConfig={defaultConfig}
      inputs={inputs}
      outputEntitySelector={outputEntitySelector}
      mapConfigToSelectedVariables={mapConfigToSelectedVariables}
      mapSelectedVariablesToConfig={mapSelectedVariablesToConfig}
      getData={getData}
      plotComponent={TestPlotComponent}
    />
  );
}
