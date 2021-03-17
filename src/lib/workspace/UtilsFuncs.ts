import { StudyEntity, StudyVariable } from '../core';

/**
 * taken from find-and: https://github.com/arfeo/find-and
 * it can be installed as npm package as well
 */

interface HashMap {
  [key: string]: any;
}

/**
 * Local helper function.
 * Returns true if the prototype for the `item` param solely comes from `Object`.
 *
 * @param item
 */
export const isObject = (item: any): boolean => {
  return !!item && Object.prototype.toString.call(item) === '[object Object]';
};

/**
 * Local helper function.
 * Returns true if the prototype for the `item` param solely comes from `Object`, and it has no keys.
 *
 * @param item
 */
export const isEmpty = (item: any): boolean => {
  return isObject(item) && Object.keys(item).length === 0;
};

/**
 * Local helper function.
 * Returns true if __all__ props of the given `predicate` exist and are equal to props of the given `source` item.
 *
 * @param sourceItem
 * @param predicate
 */
export const checkAgainstPredicate = (
  sourceItem: any,
  predicate: any
): boolean => {
  if (typeof sourceItem !== typeof predicate) {
    return false;
  }

  if (Array.isArray(sourceItem) && Array.isArray(predicate)) {
    return sourceItem.every((_, key: number): boolean =>
      checkAgainstPredicate(sourceItem[key], predicate[key])
    );
  }

  if (isObject(sourceItem) && isObject(predicate)) {
    return Object.keys(predicate).every((key: string): boolean => {
      return (
        Object.prototype.hasOwnProperty.call(sourceItem, key) &&
        checkAgainstPredicate(sourceItem[key], predicate[key])
      );
    });
  }

  return sourceItem === predicate;
};

/**
 * Function returns the found object, or an object array if there's more than one object found.
 * If the `source` param is undefined, function returns undefined.
 * If the `source` param is not an object, function returns it as is.
 * If the `predicate` param is not an object, or it's empty, function returns the unmodified `source`.
 *
 * @param source
 * @param predicate
 */
export function returnFound(source: any, predicate: HashMap): any {
  if (source === undefined) {
    return undefined;
  }

  let result: HashMap | HashMap[] | undefined = undefined;

  const appendResult = (item: HashMap): void => {
    if (!item || isEmpty(item)) {
      return;
    }

    result = result
      ? !Array.isArray(result)
        ? [result, { ...item }]
        : [...result, { ...item }]
      : item;
  };

  const processObject = (item: any): void => {
    if (checkAgainstPredicate(item, predicate)) {
      appendResult(item);
    }

    Object.keys(item).forEach((key: string): void => {
      if (isObject(item[key]) || Array.isArray(item[key])) {
        appendResult(returnFound(item[key], predicate));
      }
    });
  };

  if ((Array.isArray(source) || isObject(source)) && !isEmpty(predicate)) {
    !Array.isArray(source)
      ? processObject(source)
      : source.map((item: any): void => processObject(item));
  } else {
    return source;
  }

  return result;
}

//DKDK finding parent field
export const searchParent = (id: string, arr: any) =>
  arr.filter(({ variables }: any) =>
    variables.find((variable: any) => variable.id === id)
  );

//DKDK set fieldTree type
export interface fieldTreeType {
  field: {
    display: string;
    precision: number;
    term: string;
    isRange: boolean;
  };
  children: any[];
}

//DKDK make fielTree from entities
export const makeFieldTree = (entities: any) => {
  const fieldTreeObject: fieldTreeType = {
    // "field": {
    //   "display": "Participant",
    //   "precision": 1,
    //   "term": "EUPATH_0000096",
    //   "isRange": false,
    // },
    field: {
      display: '',
      precision: 1,
      term: '',
      isRange: false,
    },
    children: [],
  };

  for (let i = 0; i < entities.length; i++) {
    fieldTreeObject.children.push({
      field: {
        parent: entities[i].id,
        display: entities[i].displayName,
        term: entities[i].id,
        description: entities[i].description,
        // DKDK non-existent but add below two just in case: what is precision???
        precision: 1,
        isRange: false,
        // "children": (variable[i].variables[j].hasOwnProperty('dataShape')) ? variable[i].variables: [],
      },
      children: [],
    });

    // console.log(newFieldTree.children.field)

    for (let j = 0; j < entities[i].variables.length; j++) {
      //DKDK need to add adjusted object, not full object from variable.variables due to the diff of keys
      if (entities[i].variables[j].hasOwnProperty('dataShape')) {
        fieldTreeObject.children[i].children.push({
          field: {
            parent: entities[i].variables[j].parentId,
            display: entities[i].variables[j].displayName,
            term: entities[i].variables[j].id,
            type: entities[i].variables[j].type,
            //DKDK added this
            precision: 1,
            //DKDK non-existent but isRange=true -> histogram, false -> list icon
            isRange: (
              entities[i].variables[j].type === 'number'
                ? true
                : entities[i].variables[j].type === 'date'
            )
              ? true
              : false,
          },
          children: [],
        });
      }
    }
  }
  return fieldTreeObject;
};

//DKDK find initial tree variable
export function findDefaultTreeVariable(entities: StudyEntity[]) {
  //DKDK set default active variable: need to check validity for tree (dataShape)
  let defaultActiveVariable: any = {};
  for (let i = 0; i < entities[0].variables.length; i++) {
    if (entities[0].variables[i].hasOwnProperty('dataShape')) {
      defaultActiveVariable = entities[0].variables[i];
      break;
    }
  }
  return defaultActiveVariable;
}

//DKDK set initial activeField
export function findDefaultActiveField(defaultActiveVariable: StudyVariable) {
  const defaultActiveField = {
    display: defaultActiveVariable.displayName,
    isRange: (
      defaultActiveVariable.type === 'number'
        ? true
        : defaultActiveVariable.type === 'date'
    )
      ? true
      : false,
    parent: defaultActiveVariable.parentId
      ? defaultActiveVariable.parentId
      : '',
    precision: 1,
    term: defaultActiveVariable.id,
    type: defaultActiveVariable.type,
  };
  return defaultActiveField;
}
