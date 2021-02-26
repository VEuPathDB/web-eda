import * as t from 'io-ts';
export declare type StringSetFilter = t.TypeOf<typeof StringSetFilter>;
export declare const StringSetFilter: t.IntersectionC<[t.TypeC<{
    entityId: t.StringC;
    variableId: t.StringC;
}>, t.TypeC<{
    type: t.LiteralC<"stringSet">;
    stringSet: t.ArrayC<t.StringC>;
}>]>;
export declare type NumberSetFilter = t.TypeOf<typeof NumberSetFilter>;
export declare const NumberSetFilter: t.IntersectionC<[t.TypeC<{
    entityId: t.StringC;
    variableId: t.StringC;
}>, t.TypeC<{
    type: t.LiteralC<"numberSet">;
    numberSet: t.ArrayC<t.NumberC>;
}>]>;
export declare type DateSetFilter = t.TypeOf<typeof DateSetFilter>;
export declare const DateSetFilter: t.IntersectionC<[t.TypeC<{
    entityId: t.StringC;
    variableId: t.StringC;
}>, t.TypeC<{
    type: t.LiteralC<"dateSet">;
    dateSet: t.ArrayC<t.StringC>;
}>]>;
export declare type NumberRangeFilter = t.TypeOf<typeof NumberRangeFilter>;
export declare const NumberRangeFilter: t.IntersectionC<[t.TypeC<{
    entityId: t.StringC;
    variableId: t.StringC;
}>, t.TypeC<{
    type: t.LiteralC<"numberRange">;
    min: t.NumberC;
    max: t.NumberC;
}>]>;
export declare type DateRangeFilter = t.TypeOf<typeof DateRangeFilter>;
export declare const DateRangeFilter: t.IntersectionC<[t.TypeC<{
    entityId: t.StringC;
    variableId: t.StringC;
}>, t.TypeC<{
    type: t.LiteralC<"dateRange">;
    min: t.StringC;
    max: t.StringC;
}>]>;
export declare type Filter = t.TypeOf<typeof Filter>;
export declare const Filter: t.UnionC<[t.IntersectionC<[t.TypeC<{
    entityId: t.StringC;
    variableId: t.StringC;
}>, t.TypeC<{
    type: t.LiteralC<"stringSet">;
    stringSet: t.ArrayC<t.StringC>;
}>]>, t.IntersectionC<[t.TypeC<{
    entityId: t.StringC;
    variableId: t.StringC;
}>, t.TypeC<{
    type: t.LiteralC<"numberSet">;
    numberSet: t.ArrayC<t.NumberC>;
}>]>, t.IntersectionC<[t.TypeC<{
    entityId: t.StringC;
    variableId: t.StringC;
}>, t.TypeC<{
    type: t.LiteralC<"dateSet">;
    dateSet: t.ArrayC<t.StringC>;
}>]>, t.IntersectionC<[t.TypeC<{
    entityId: t.StringC;
    variableId: t.StringC;
}>, t.TypeC<{
    type: t.LiteralC<"numberRange">;
    min: t.NumberC;
    max: t.NumberC;
}>]>, t.IntersectionC<[t.TypeC<{
    entityId: t.StringC;
    variableId: t.StringC;
}>, t.TypeC<{
    type: t.LiteralC<"dateRange">;
    min: t.StringC;
    max: t.StringC;
}>]>]>;
//# sourceMappingURL=filter.d.ts.map