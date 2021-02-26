/* eslint-disable @typescript-eslint/no-redeclare */
import * as t from 'io-ts';
import { Filter } from './filter';
export const DerviedVariable = t.unknown;
export const VariableUISetting = t.UnknownRecord;
export const Visualization = t.unknown;
export const NewSession = t.type({
    name: t.string,
    studyId: t.string,
    filters: t.array(Filter),
    derivedVariables: t.array(DerviedVariable),
    starredVariables: t.array(t.string),
    variableUISettings: t.record(t.string, VariableUISetting),
    visualizations: t.array(Visualization),
});
export const Session = t.intersection([
    NewSession,
    t.type({
        id: t.string,
        created: t.string,
        modified: t.string,
    }),
]);
//# sourceMappingURL=session.js.map