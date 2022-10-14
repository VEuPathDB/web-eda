/** @jsxImportSource @emotion/react */
import { useStudyMetadata } from '../../..';
import { useCollectionVariables } from '../../../hooks/workspace';
import { VariableDescriptor } from '../../../types/variable';
import { StudyEntity } from '../../../types/study';
import { boxplotVisualization } from '../../visualizations/implementations/BoxplotVisualization';
import { scatterplotVisualization } from '../../visualizations/implementations/ScatterplotVisualization';
import { ComputationConfigProps, ComputationPlugin } from '../Types';
import { H6 } from '@veupathdb/coreui';
import { isEqual, partial } from 'lodash';
import { assertComputationWithConfig, useConfigChangeHandler } from '../Utils';
import { findCollections } from '../../../utils/study-metadata';
import * as t from 'io-ts';
import { Computation } from '../../../types/visualization';
import SingleSelect from '@veupathdb/coreui/dist/components/inputs/SingleSelect';

export type AbundanceConfig = t.TypeOf<typeof AbundanceConfig>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const AbundanceConfig = t.type({
  name: t.string,
  collectionVariable: VariableDescriptor,
  rankingMethod: t.string,
});

export const plugin: ComputationPlugin = {
  configurationComponent: AbundanceConfiguration,
  configurationDescriptionComponent: AbundanceConfigDescriptionComponent,
  createDefaultConfiguration,
  isConfigurationValid: AbundanceConfig.is,
  visualizationPlugins: {
    boxplot: boxplotVisualization.withOptions({
      getXAxisVariable(config) {
        if (AbundanceConfig.is(config)) {
          return config.collectionVariable;
        }
      },
      getComputedYAxisDetails(config) {
        if (AbundanceConfig.is(config)) {
          return {
            entityId: config.collectionVariable.entityId,
            placeholderDisplayName: 'Relative abundance',
          };
        }
      },
      getPlotSubtitle(config) {
        if (AbundanceConfig.is(config)) {
          return `Ranked abundance: Variables with ${config.rankingMethod} = 0 removed. Showing up to the top ten variables.`;
        }
      },
      hideShowMissingnessToggle: true,
    }),
    scatterplot: scatterplotVisualization.withOptions({
      getComputedYAxisDetails(config) {
        if (AbundanceConfig.is(config)) {
          return {
            entityId: config.collectionVariable.entityId,
            placeholderDisplayName: 'Relative abundance',
          };
        }
      },
      getComputedOverlayVariable(config) {
        if (AbundanceConfig.is(config)) {
          return config.collectionVariable;
        }
      },
      getPlotSubtitle(config) {
        if (AbundanceConfig.is(config)) {
          return `Ranked abundance: Variables with ${config.rankingMethod} = 0 removed. Showing up to the top ten variables.`;
        }
      },
      hideShowMissingnessToggle: true,
    }),
  },
};

function AbundanceConfigDescriptionComponent({
  computation,
}: {
  computation: Computation;
}) {
  const studyMetadata = useStudyMetadata();
  const collections = useCollectionVariables(studyMetadata.rootEntity);
  assertComputationWithConfig<AbundanceConfig>(computation, Computation);
  const { configuration } = computation.descriptor;
  const updatedCollectionVariable = collections.find((collectionVar) =>
    isEqual(
      {
        variableId: collectionVar.id,
        entityId: collectionVar.entityId,
      },
      configuration.collectionVariable
    )
  );
  return (
    <>
      <h4 style={{ padding: '15px 0 0 0', marginLeft: 20 }}>
        Data:{' '}
        <span style={{ fontWeight: 300 }}>
          {`${updatedCollectionVariable?.entityDisplayName} > ${updatedCollectionVariable?.displayName}`}
        </span>
      </h4>
      <h4 style={{ padding: 0, marginLeft: 20 }}>
        Method:{' '}
        <span style={{ fontWeight: 300 }}>
          {configuration.rankingMethod[0].toUpperCase() +
            configuration.rankingMethod.slice(1)}
        </span>
      </h4>
    </>
  );
}

function createDefaultConfiguration(rootEntity: StudyEntity): AbundanceConfig {
  const collections = findCollections(rootEntity);
  return {
    name: 'RankedAbundanceComputation',
    collectionVariable: {
      variableId: collections[0].id,
      entityId: collections[0].entityId ?? '',
    },
    rankingMethod: 'median',
  };
}

// Include available methods in this array.
const ABUNDANCE_METHODS = ['median', 'q3', 'variance', 'max'];

export function AbundanceConfiguration(props: ComputationConfigProps) {
  const {
    computationAppOverview,
    computation,
    analysisState,
    visualizationId,
  } = props;
  const studyMetadata = useStudyMetadata();
  // Include known collection variables in this array.
  const collections = useCollectionVariables(studyMetadata.rootEntity);
  if (collections.length === 0)
    throw new Error('Could not find any collections for this app.');

  assertComputationWithConfig<AbundanceConfig>(computation, Computation);
  const configuration = computation.descriptor.configuration;
  const { rankingMethod, collectionVariable } = configuration;

  const changeConfigHandler = useConfigChangeHandler<AbundanceConfig>(
    analysisState,
    computation,
    visualizationId
  );

  const selectedDataConfig = collections.find(
    (collectionVar) =>
      collectionVar.id === collectionVariable.variableId &&
      collectionVar.entityId === collectionVariable.entityId
  );
  const dataConfigButtonDisplay =
    selectedDataConfig?.entityDisplayName +
    ' > ' +
    selectedDataConfig?.displayName;

  return (
    <div style={{ display: 'flex', gap: '0 2em', padding: '1em 0' }}>
      <H6 additionalStyles={{ margin: 0 }}>
        {computationAppOverview.displayName[0].toUpperCase() +
          computationAppOverview.displayName.substring(1).toLowerCase() +
          ' parameters:'}
      </H6>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '.5em 1em',
          width: '800px',
          justifyItems: 'start',
          alignItems: 'center',
        }}
      >
        <span style={{ justifySelf: 'end', fontWeight: 500 }}>Data</span>
        <SingleSelect
          value={{
            variableId: collectionVariable.variableId,
            entityId: collectionVariable.entityId,
          }}
          buttonDisplayContent={dataConfigButtonDisplay}
          items={collections.map((collectionVar) => ({
            value: {
              variableId: collectionVar.id,
              entityId: collectionVar.entityId,
            },
            display:
              collectionVar.entityDisplayName +
              ' > ' +
              collectionVar.displayName,
          }))}
          onSelect={partial(changeConfigHandler, 'collectionVariable')}
        />
        <span style={{ justifySelf: 'end', fontWeight: 500 }}>Method</span>
        <SingleSelect
          value={rankingMethod}
          buttonDisplayContent={rankingMethod}
          onSelect={partial(changeConfigHandler, 'rankingMethod')}
          items={ABUNDANCE_METHODS.map((method) => ({
            value: method,
            display: method,
          }))}
        />
      </div>
    </div>
  );
}
