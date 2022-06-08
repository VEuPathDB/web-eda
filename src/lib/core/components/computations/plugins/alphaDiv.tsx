/** @jsxImportSource @emotion/react */
import { useRouteMatch } from 'react-router-dom';
import { useHistory } from 'react-router';
import { useStudyMetadata } from '../../..';
import { StudyEntity } from '../../../types/study';
import { useCollectionVariables } from '../../../hooks/study';
import { VariableDescriptor } from '../../../types/variable';
import { boxplotVisualization } from '../../visualizations/implementations/BoxplotVisualization';
import { scatterplotVisualization } from '../../visualizations/implementations/ScatterplotVisualization';
import { ComputationConfigProps, ComputationPlugin } from '../Types';
import { H6 } from '@veupathdb/coreui';
import { isEqual } from 'lodash';
import { createComputation, assertConfigType } from '../Utils';
import { findCollections } from '../../../utils/study-metadata';
import * as t from 'io-ts';

export const plugin: ComputationPlugin = {
  configurationComponent: AlphaDivConfiguration,
  visualizationTypes: {
    boxplot: boxplotVisualization,
    scatterplot: scatterplotVisualization,
  },
  createDefaultComputationSpec: createDefaultComputationSpec,
};

function createDefaultComputationSpec(rootEntity: StudyEntity) {
  const collections = findCollections(rootEntity);
  const configuration: AlphaDivConfig = {
    name: 'AlphaDivComputation',
    collectionVariable: {
      variableId: collections[0].id,
      entityId: collections[0].entityId,
    },
    alphaDivMethod: 'shannon',
  };
  return {
    displayName: `${collections[0].entityDisplayName} > ${collections[0].displayName}&;&shannon`,
    configuration,
  };
}

export type AlphaDivConfig = t.TypeOf<typeof AlphaDivConfig>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const AlphaDivConfig = t.type({
  name: t.string,
  collectionVariable: VariableDescriptor,
  alphaDivMethod: t.string,
});

// Include available methods in this array.
const ALPHA_DIV_METHODS = ['shannon', 'simpson', 'evenness'];

function variableDescriptorToString(
  variableDescriptor: VariableDescriptor
): string {
  return JSON.stringify(variableDescriptor);
}

export function AlphaDivConfiguration(props: ComputationConfigProps) {
  const {
    computationAppOverview,
    computation,
    analysisState,
    visualizationId,
  } = props;
  const studyMetadata = useStudyMetadata();
  const { url } = useRouteMatch();
  const history = useHistory();
  // Include known collection variables in this array.
  const collections = useCollectionVariables(studyMetadata.rootEntity);
  if (collections.length === 0)
    throw new Error('Could not find any collections for this app.');

  assertConfigType(computation.descriptor.configuration, AlphaDivConfig);

  const alphaDivMethod = computation.descriptor.configuration.alphaDivMethod;
  const collectionVariable =
    computation.descriptor.configuration.collectionVariable;

  const changeConfigHandler = async (
    changedConfigPropertyName: string,
    newConfigValue: string
  ) => {
    // when a config value changes:
    // 1. remove viz from current computation
    // 2. check if the newConfig exists
    // Y? move viz to the found computation, "existingComputation"
    // N? create new computation
    const computations = analysisState.analysis
      ? analysisState.analysis.descriptor.computations
      : [];

    assertConfigType(computation.descriptor.configuration, AlphaDivConfig);

    const updatedConfiguration = {
      ...computation.descriptor.configuration,
      [changedConfigPropertyName]: newConfigValue,
    };
    const existingComputation = computations.find(
      (c) =>
        isEqual(c.descriptor.configuration, updatedConfiguration) &&
        c.descriptor.type === computation.descriptor.type
    );
    const existingVisualization = computation.visualizations.filter(
      (viz) => viz.visualizationId === visualizationId
    );
    const computationAfterVizRemoval = {
      ...computation,
      visualizations: computation.visualizations.filter(
        (viz) => viz.visualizationId !== visualizationId
      ),
    };
    if (existingComputation) {
      // 2Y:  move viz to existingComputation
      const existingComputationWithVizAdded = {
        ...existingComputation,
        visualizations: existingComputation.visualizations.concat(
          existingVisualization
        ),
      };
      computationAfterVizRemoval.visualizations.length
        ? await analysisState.setComputations([
            computationAfterVizRemoval,
            existingComputationWithVizAdded,
            ...computations
              .filter(
                (c) => c.computationId !== existingComputation.computationId
              )
              .filter((c) => c.computationId !== computation.computationId),
          ])
        : await analysisState.setComputations([
            existingComputationWithVizAdded,
            ...computations
              .filter(
                (c) => c.computationId !== existingComputation.computationId
              )
              .filter((c) => c.computationId !== computation.computationId),
          ]);
      history.push(
        url.replace(
          computation.computationId,
          existingComputation.computationId
        )
      );
    } else {
      // 2N:  existingComputation was not found
      //      get config displayName for new computation
      //      create a new computation with the existing viz
      const updatedCollectionVariable = collections.find((collectionVar) =>
        isEqual(
          {
            variableId: collectionVar.id,
            entityId: collectionVar.entityId,
          },
          updatedConfiguration.collectionVariable
        )
      );
      const newComputation = createComputation(
        computation.descriptor.type,
        `${updatedCollectionVariable?.entityDisplayName} > ${updatedCollectionVariable?.displayName}&;&${updatedConfiguration.alphaDivMethod}`,
        updatedConfiguration,
        computations,
        existingVisualization
      );
      computationAfterVizRemoval.visualizations.length
        ? await analysisState.setComputations([
            computationAfterVizRemoval,
            newComputation,
            ...computations.filter(
              (c) => c.computationId !== computation.computationId
            ),
          ])
        : await analysisState.setComputations([
            newComputation,
            ...computations.filter(
              (c) => c.computationId !== computation.computationId
            ),
          ]);
      history.push(
        url.replace(computation.computationId, newComputation.computationId)
      );
    }
  };

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
        <div style={{ justifySelf: 'end', fontWeight: 500 }}>Data</div>
        <select
          css={{
            backgroundColor: '#e0e0e0',
            cursor: 'pointer',
            border: 0,
            padding: '6px 16px',
            fontSize: '0.8125rem',
            minWidth: '64px',
            boxSizing: 'border-box',
            transition:
              'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
            fontFamily:
              'Roboto, "Helvetica Neue", Helvetica, "Segoe UI", Arial, freesans, sans-serif',
            fontWeight: 500,
            lineHeight: 1.25,
            borderRadius: '4px',
            textTransform: 'none',
            boxShadow:
              '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
            '&:hover': {
              boxShadow: `0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)`,
              backgroundColor: `#d5d5d5`,
            },
          }}
          value={variableDescriptorToString({
            variableId: collectionVariable.variableId,
            entityId: collectionVariable.entityId,
          })}
          onChange={(e) =>
            changeConfigHandler(
              'collectionVariable',
              JSON.parse(e.target.value)
            )
          }
        >
          {collections.map((collectionVar) => {
            return (
              <option
                key={collectionVar.id}
                value={variableDescriptorToString({
                  variableId: collectionVar.id,
                  entityId: collectionVar.entityId,
                })}
              >
                {collectionVar.entityDisplayName} {' > '}{' '}
                {collectionVar.displayName}
              </option>
            );
          })}
        </select>
        <div style={{ justifySelf: 'end', fontWeight: 500 }}>Method</div>
        <select
          css={{
            backgroundColor: '#e0e0e0',
            cursor: 'pointer',
            border: 0,
            padding: '6px 16px',
            fontSize: '0.8125rem',
            minWidth: '64px',
            boxSizing: 'border-box',
            transition:
              'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
            fontFamily:
              'Roboto, "Helvetica Neue", Helvetica, "Segoe UI", Arial, freesans, sans-serif',
            fontWeight: 500,
            lineHeight: 1.25,
            borderRadius: '4px',
            textTransform: 'none',
            boxShadow:
              '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
            '&:hover': {
              boxShadow: `0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)`,
              backgroundColor: `#d5d5d5`,
            },
          }}
          value={alphaDivMethod}
          onChange={(e) =>
            changeConfigHandler('alphaDivMethod', e.target.value)
          }
        >
          {ALPHA_DIV_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
