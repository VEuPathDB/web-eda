/*
 * These adapters can be used to convert filter objects between EDA and WDK
 * types. Note that the generated WDK filter object includes a rogue property
 * named `__entityId`. This information is needed for EDA.
 */
/** Convert a WDK Filter to an EDA Filter */
export function toEdaFilter(filter, entityId) {
    const variableId = filter.field;
    if ('__entityId' in filter)
        entityId = filter.__entityId;
    const type = filter.isRange
        ? filter.type === 'number'
            ? 'numberRange'
            : 'dateRange'
        : filter.type === 'string'
            ? 'stringSet'
            : filter.type === 'number'
                ? 'numberSet'
                : 'dateSet';
    return (type === 'dateSet'
        ? {
            entityId,
            variableId,
            type,
            dateSet: filter.value.map((d) => d + 'T00:00:00'),
        }
        : type === 'numberSet'
            ? {
                entityId,
                variableId,
                type,
                numberSet: filter.value,
            }
            : type === 'stringSet'
                ? {
                    entityId,
                    variableId,
                    type,
                    stringSet: filter.value,
                }
                : type === 'dateRange'
                    ? {
                        entityId,
                        variableId,
                        type,
                        min: filter.value.min + 'T00:00:00',
                        max: filter.value.max + 'T00:00:00',
                    }
                    : {
                        entityId,
                        variableId,
                        type,
                        min: filter.value.min,
                        max: filter.value.max,
                    });
}
/** Convert an EDA Filter to a WDK Filter */
export function fromEdaFilter(filter) {
    return {
        field: filter.variableId,
        isRange: filter.type.endsWith('Range'),
        includeUnknown: false,
        type: filter.type.replace(/(Set|Range)/, ''),
        value: filter.type === 'dateRange'
            ? {
                min: filter.min.replace('T00:00:00', ''),
                max: filter.max.replace('T00:00:00', ''),
            }
            : filter.type === 'numberRange'
                ? {
                    min: filter.min,
                    max: filter.max,
                }
                : filter.type === 'dateSet'
                    ? filter[filter.type].map((d) => d.replace('T00:00:00', ''))
                    : filter.type === 'stringSet'
                        ? filter[filter.type]
                        : filter[filter.type],
        __entityId: filter.entityId,
    };
}
export function toWdkVariableSummary(foreground, background, variable) {
    const activeField = {
        display: variable.displayName,
        isRange: variable.dataShape === 'continuous',
        parent: variable.parentId,
        precision: 1,
        term: variable.id,
        type: variable.type,
        variableName: variable.providerLabel,
    };
    return {
        distribution: Object.entries(background.distribution).map(([value, count]) => ({
            count,
            filteredCount: foreground.distribution[value],
            value,
        })),
        entitiesCount: background.entitiesCount,
        filteredEntitiesCount: foreground.entitiesCount,
        activeField,
    };
}
//# sourceMappingURL=wdk-filter-param-adapter.js.map