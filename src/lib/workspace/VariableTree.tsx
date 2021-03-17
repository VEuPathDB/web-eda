/* variableTree component that bridges fieldList & checkBoxTree components */

//DKDK import Dispatch & SetStateAction for typing
import { useState } from 'react';

//DKDK import CSS, pre-existing FieldList, and utility functions
import './VariableTreeCSS.css';
import FieldList from '@veupathdb/wdk-client/lib/Components/AttributeFilter/FieldList';
//DKDK Utils Funcs may be combined with Utils.ts
import {
  fieldTreeType,
  makeFieldTree,
  returnFound,
  searchParent,
} from './UtilsFuncs';
import { StudyEntity, StudyVariable } from '../core';

//DKDK set activeField prop
export interface activeFieldProp {
  parent: string;
  variableName?: string;
  display: string;
  precision: number;
  term: string;
  type: string;
  isRange: boolean;
}

//DKDK set VariableTree prop
interface VariableTreeProp {
  entities: Array<{}>;
  onVariableChange: (newStudy: StudyEntity, newVariable: StudyVariable) => void;
}

export const VariableTree = (props: VariableTreeProp) => {
  const { entities, onVariableChange } = props;

  //DKDK construct fieldTree format: can be obtained using useStudyMetadata() here but got it as a prop from parent for now
  const fieldTree: fieldTreeType = makeFieldTree(entities); // TO DO: memoize?

  const [activeField, setActiveField] = useState<activeFieldProp>({
    ...fieldTree.field, // use the root of the fieldTree as the default active field?
    parent: '',
    type: '',
  });

  //DKDK handling activeField - activeField is somehow not working yet
  const onActiveFieldChange = (term: any) => {
    // console.log('onActiveFieldChange data =', term)

    //DKDK find entity for data
    const entity = searchParent(term, entities)[0];

    //DKDK find and set variable from fieldTree's term (entities' id)
    const resultVariable = returnFound(entities, { id: term });
    // console.log('resultVariable =', resultVariable)
    onVariableChange(
      entity,
      Array.isArray(resultVariable) ? resultVariable[0] : resultVariable
    );

    //DKDK find and set activeField from fieldTree's term
    let resultActiveField = returnFound(fieldTree, { term: term });
    // console.log('resultActiveField =', resultActiveField)
    if (Array.isArray(resultActiveField)) {
      setActiveField(resultActiveField[1]);
    } else {
      setActiveField(resultActiveField);
    }
  };

  //DKDK it appears to me that this valuesMap is additional keywords for specific ID(s): no need to set for now
  // const valuesMap = {"EUPATH_0000033":["Homozygotes (female)","Hemizygote (male)","Heterozygotes (female)","No results","Normal (female)","Normal (male)"],"EUPATH_0000034":["Alpha 0 thalassemia","Normal","No result","Alpha + thalassemia"],"EUPATH_0000219":["During dynamic recruitment","At time of initial household enrollment"],"EUPATH_0000737":["Missing","Heterozygous","Wild type","Homozygous"],"EUPATH_0020001":["Diarrheal illness","Complications of hiv","Suicide"],"PATO_0000047":["Male","Female"],"EUPATH_0010067":["Hospital","Home"],"EUPATH_0000035":["Hb ss","Hb aa","Hb as","No result"]};
  const valuesMap = {};

  // //DKDK
  // console.log('initial activeField at variabletree =', activeField)

  //DKDK FieldListTest is basically the same with FieldList except some changes for fixing activeField issue
  return (
    <FieldList
      autoFocus={false}
      fieldTree={fieldTree}
      onActiveFieldChange={onActiveFieldChange}
      activeField={activeField}
      valuesMap={valuesMap}
    />
  );
};
