import * as t from 'io-ts';
export declare type DerviedVariable = t.TypeOf<typeof DerviedVariable>;
export declare const DerviedVariable: t.UnknownC;
export declare type VariableUISetting = t.TypeOf<typeof VariableUISetting>;
export declare const VariableUISetting: t.UnknownRecordC;
export declare type Visualization = t.TypeOf<typeof Visualization>;
export declare const Visualization: t.UnknownC;
export declare type NewSession = t.TypeOf<typeof NewSession>;
export declare const NewSession: t.TypeC<{
    name: t.StringC;
    studyId: t.StringC;
    filters: t.ArrayC<t.UnionC<[t.IntersectionC<[t.TypeC<{
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
    }>]>]>>;
    derivedVariables: t.ArrayC<t.UnknownC>;
    starredVariables: t.ArrayC<t.StringC>;
    variableUISettings: t.RecordC<t.StringC, t.UnknownRecordC>;
    visualizations: t.ArrayC<t.UnknownC>;
}>;
export declare type Session = t.TypeOf<typeof Session>;
export declare const Session: t.IntersectionC<[t.TypeC<{
    name: t.StringC;
    studyId: t.StringC;
    filters: t.ArrayC<t.UnionC<[t.IntersectionC<[t.TypeC<{
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
    }>]>]>>;
    derivedVariables: t.ArrayC<t.UnknownC>;
    starredVariables: t.ArrayC<t.StringC>;
    variableUISettings: t.RecordC<t.StringC, t.UnknownRecordC>;
    visualizations: t.ArrayC<t.UnknownC>;
}>, t.TypeC<{
    id: t.StringC;
    created: t.StringC;
    modified: t.StringC;
}>]>;
//# sourceMappingURL=session.d.ts.map