/* eslint-disable @typescript-eslint/no-redeclare */
import * as t from 'io-ts';
export const StudyVariable = t.intersection([
    t.type({
        id: t.string,
        providerLabel: t.string,
        displayName: t.string,
        type: t.string,
        isMultiValued: t.boolean,
        // description: t.string,
    }),
    t.partial({
        parentId: t.string,
        displayType: t.string,
        dataShape: t.string,
    }),
]);
const _StudyEntityBase = t.type({
    id: t.string,
    displayName: t.string,
    description: t.string,
    variables: t.array(StudyVariable),
    // displayNamePlural: t.string,
});
export const StudyEntity = t.recursion('StudyEntity', () => t.intersection([
    _StudyEntityBase,
    t.partial({
        children: t.array(StudyEntity),
    }),
]));
export const StudyOverview = t.type({
    id: t.string,
    datasetId: t.string,
    // name: t.string,
});
export const StudyMetadata = t.intersection([
    StudyOverview,
    t.type({
        rootEntity: StudyEntity,
    }),
]);
//# sourceMappingURL=study.js.map