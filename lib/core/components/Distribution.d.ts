import { StudyEntity, StudyMetadata, StudyVariable } from '../types/study';
import { Filter as EdaFilter } from '../types/filter';
interface Props {
    studyMetadata: StudyMetadata;
    entity: StudyEntity;
    variable: StudyVariable;
    filters?: EdaFilter[];
    onFiltersChange: (filters: EdaFilter[]) => void;
}
export declare function Distribution(props: Props): JSX.Element | null;
export {};
//# sourceMappingURL=Distribution.d.ts.map