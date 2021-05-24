import { mapStructure } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import { isEmpty, union } from 'lodash';
import { StudyEntity } from '../types/study';
import { Variable } from '../types/variable';
import { DataElementConstraint } from '../types/visualization';
import { findEntityAndVariable } from './study-metadata';

export function filterVariablesByConstraint(
  rootEntity: StudyEntity,
  constraint?: DataElementConstraint
): StudyEntity {
  if (
    constraint == null ||
    (constraint.allowedShapes == null && constraint.allowedTypes == null)
  )
    return rootEntity;
  return mapStructure(
    (entity, children) => ({
      ...entity,
      variables: entity.variables.filter(
        (variable) =>
          variable.dataShape == null ||
          variable.type === 'category' ||
          ((constraint.allowedShapes == null ||
            constraint.allowedShapes.includes(variable.dataShape)) &&
            (constraint.allowedTypes == null ||
              constraint.allowedTypes.includes(variable.type)))
      ),
      children,
    }),
    (e) => e.children ?? [],
    rootEntity
  );
}

export type ValueByInputName = Partial<Record<string, Variable>>;
export type DataElementConstraintRecord = Record<string, DataElementConstraint>;

/**
 * Given an array of DataElementConstraint objects and a set of values, return
 * a unioned DataElementConstraint object that includes all of the rules for
 * which the provided values satisfy.
 *
 * example: one contraint allows string x number, the other date x string
 *
 * constraints = [ { xAxisVariable: { allowedTypes: ['string'] }, yAxisVariable: { allowedTypes: ['number'] } },
                   { xAxisVariable: { allowedTypes: ['date'] }, yAxisVariable: { allowedTypes: ['string'] } } ]
 *
 * If the user has already chosen a string-type xAxisVariable, the
 * constraints.filter() below will allow constraints[0] to pass but
 * will exclude constraints[1] because the already chosen string
 * x-variable is not a date. It won't even check the yAxisVariable of
 * constraint[1] because of the all-or-nothing nature of constraints.
 *
 * The constraints passed by the filter are merged into one.
 *
 * If no variable has been selected by the user, then the final merged constraint would be
 * { xAxisVariable: { allowedTypes: ['string','date'] }, yAxisVariable: { allowedTypes: ['number', 'string'] } }
 *
 */
export function flattenConstraints(
  values: ValueByInputName,
  entities: StudyEntity[],
  constraints: DataElementConstraintRecord[]
): DataElementConstraintRecord {
  // Find all compatible constraints
  const compatibleConstraints = constraints.filter((constraintRecord) =>
    Object.entries(constraintRecord).every(([variableName, constraint]) => {
      const value = values[variableName];
      // If a value (variable) has not been user-selected for this constraint, then it is considered to be "in-play"
      if (value == null) return true;
      // If a constraint does not declare shapes or types, then any value is allowed, thus the constraint is "in-play"
      if (isEmpty(constraint.allowedShapes) || isEmpty(constraint.allowedTypes))
        return true;
      // Check that the value's associated variable has a compatible type and shape
      const entityAndVariable = findEntityAndVariable(entities, value);
      if (entityAndVariable == null)
        throw new Error(
          `Could not find selected entity and variable: entityId = ${value.entityId}; variableId = ${value.variableId}.`
        );
      const { variable } = entityAndVariable;
      const typeIsValid =
        isEmpty(constraint.allowedTypes) ||
        constraint.allowedTypes?.includes(variable.type);
      const shapeIsValid =
        isEmpty(constraint.allowedShapes) ||
        constraint.allowedShapes?.includes(variable.dataShape!);
      return typeIsValid && shapeIsValid;
    })
  );
  if (compatibleConstraints.length === 0)
    throw new Error(
      'flattenConstraints: Something went wrong. No compatible constraints were found for the current set of values.'
    );
  // Combine compatible constraints into a single constraint, concatenating
  // allowed shapes and types.
  return compatibleConstraints.reduce(
    mergeConstraints,
    {} as DataElementConstraintRecord
  );
}

export function mergeConstraints(
  constraintMapA: DataElementConstraintRecord,
  constraintMapB: DataElementConstraintRecord
): DataElementConstraintRecord {
  const keys = union(Object.keys(constraintMapA), Object.keys(constraintMapB));
  return Object.fromEntries(
    keys.map((key): [string, DataElementConstraint] => {
      const constraintA = constraintMapA[key];
      const constraintB = constraintMapB[key];
      return [
        key,
        constraintA == null
          ? constraintB
          : constraintB == null
          ? constraintA
          : {
              isRequired: constraintA.isRequired || constraintB.isRequired,
              maxNumVars: Math.max(
                constraintA.maxNumVars,
                constraintB.maxNumVars
              ),
              minNumVars: Math.min(
                constraintA.minNumVars,
                constraintB.minNumVars
              ),
              allowedShapes: union(
                constraintA.allowedShapes,
                constraintB.allowedShapes
              ),
              allowedTypes: union(
                constraintA.allowedTypes,
                constraintB.allowedTypes
              ),
            },
      ];
    })
  );
}
