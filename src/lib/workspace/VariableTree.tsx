/* variableTree component that bridges fieldList & checkBoxTree components */

//DKDK import Dispatch & SetStateAction for typing
import { useEffect, Dispatch, SetStateAction } from 'react';

//DKDK import CSS, pre-existing FieldList, and utility functions
import './VariableTreeCSS.css';
import FieldList from '@veupathdb/wdk-client/lib/Components/AttributeFilter/FieldList';
//DKDK Utils Funcs may be combined with Utils.ts
import { fieldTreeType, makeFieldTree } from './UtilsFuncs';

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
  setFieldTree: Dispatch<SetStateAction<fieldTreeType>>;
  onActiveFieldChange: Dispatch<SetStateAction<activeFieldProp>>;
  activeField: activeFieldProp | null;
}

export const VariableTree = (props: VariableTreeProp) => {
  const { entities, setFieldTree, onActiveFieldChange, activeField } = props;

  //DKDK getting entities works here, but for now it is set to a prop from the parent
  // const studyMetadata = useStudyMetadata();
  // const entities = Array.from(
  //   preorder(studyMetadata.rootEntity, (e) => e.children || [])
  // );

  //DKDK construct fieldTree format: can be obtained using useStudyMetadata() here but got it as a prop from parent for now
  const fieldTree: fieldTreeType = makeFieldTree(entities);

  //DKDK use useEffect to run setFieldTree once to avoid infinite loop
  useEffect(() => {
    //DKDK return fieldTree to parent
    setFieldTree(fieldTree);
  }, []);

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
