import { useState } from 'react';
import { useStudyEntities } from '../../hooks/study';
import { useStudyMetadata } from '../../hooks/workspace';
import { VariablesByInputName } from '../../utils/data-element-constraints';
import { CustomSectionSpec, InputSpec, InputVariables } from './InputVariables';
import { VisualizationProps } from './VisualizationTypes';

interface Props extends VisualizationProps {
  inputs: InputSpec[];
  customInputSections?: CustomSectionSpec[];
  /** Name of input that determines the output entity */
  outputEntitySelectorName: string; // XXX Should this be part of the inputSpec?
}

export function StandardVisualization(props: Props) {
  const {
    inputs,
    starredVariables,
    toggleStarredVariable,
    customInputSections,
    dataElementConstraints,
    dataElementDependencyOrder,
    outputEntitySelectorName,
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
  const outputEntity = undefined;
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
