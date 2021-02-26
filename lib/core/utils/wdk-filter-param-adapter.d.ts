import { Filter as EdaFilter } from '../types/filter';
import { Filter as WdkFilter } from '@veupathdb/wdk-client/lib/Components/AttributeFilter/Types';
import { DistributionResponse } from '../api/eda-api';
import { StudyVariable } from '../types/study';
/** Convert a WDK Filter to an EDA Filter */
export declare function toEdaFilter(filter: WdkFilter, entityId: string): EdaFilter;
/** Convert an EDA Filter to a WDK Filter */
export declare function fromEdaFilter(filter: EdaFilter): WdkFilter;
export declare function toWdkVariableSummary(foreground: DistributionResponse, background: DistributionResponse, variable: StudyVariable): {
    distribution: {
        count: number;
        filteredCount: number;
        value: string;
    }[];
    entitiesCount: number;
    filteredEntitiesCount: number;
    activeField: {
        display: string;
        isRange: boolean;
        parent: string | undefined;
        precision: number;
        term: string;
        type: string;
        variableName: string;
    };
};
//# sourceMappingURL=wdk-filter-param-adapter.d.ts.map