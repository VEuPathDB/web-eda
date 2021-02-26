import { SessionState, StudyEntity, StudyVariable } from '../core';
interface RouteProps {
    sessionId: string;
    entityId?: string;
    variableId?: string;
}
export declare function SubsettingRoute(props: RouteProps): JSX.Element | null;
interface Props {
    sessionState: SessionState;
    entity: StudyEntity;
    entities: StudyEntity[];
    variable: StudyVariable;
}
export declare function Subsetting(props: Props): JSX.Element;
export {};
//# sourceMappingURL=Subsetting.d.ts.map