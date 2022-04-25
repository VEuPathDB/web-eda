import { useState } from 'react';
import { useStudyEntities } from '../../hooks/study';
import { useStudyMetadata } from '../../hooks/workspace';
import { VariablesByInputName } from '../../utils/data-element-constraints';
import { CustomSectionSpec, InputSpec, InputVariables } from './InputVariables';
import { VisualizationProps } from './VisualizationTypes';

interface Props extends VisualizationProps {
  /**
   * Describes what inputs the user can configure.
   */
  inputs: InputSpec[];
  /**
   * Custom input selectors
   */
  customInputSections?: CustomSectionSpec[];
  /**
   * A function that returns the ID of the output entity for the visualization
   */
  outputEntitySelector: (selectedVariables: VariablesByInputName) => string;
}

export function StandardVsualization(props: Props) {
  const {
    inputs,
    starredVariables,
    toggleStarredVariable,
    customInputSections,
    dataElementConstraints,
    dataElementDependencyOrder,
    outputEntitySelector,
  } = props;
  const studyMetadata = useStudyMetadata();
  const entities = useStudyEntities(studyMetadata.rootEntity);
  const [
    selectedVariables,
    setSelectedVariables,
  ] = useState<VariablesByInputName>({});
  const [showMissingness, setShowMissingness] = useState(false);
  // FIXME This is derived from data
  // See https://github.com/VEuPathDB/web-eda/issues/580#issuecomment-1104362246
  const enableShowMissingnessToggle = true;

  // Find output entity.
  const outputEntityId = outputEntitySelector(selectedVariables);
  const outputEntity = entities.find((e) => e.id === outputEntityId);
  return (
    <div>
      <InputVariables
        inputs={inputs}
        entities={entities}
        customSections={customInputSections}
        selectedVariables={selectedVariables}
        onChange={setSelectedVariables}
        constraints={dataElementConstraints}
        dataElementDependencyOrder={dataElementDependencyOrder}
        starredVariables={starredVariables}
        toggleStarredVariable={toggleStarredVariable}
        enableShowMissingnessToggle={enableShowMissingnessToggle}
        showMissingness={showMissingness}
        onShowMissingnessChange={setShowMissingness}
        outputEntity={outputEntity}
      />
    </div>
  );
}
