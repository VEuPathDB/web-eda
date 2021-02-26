import { StudyVariable, StudyEntity } from '../core';
interface RouteProps {
    sessionId: string;
    entityId?: string;
    variableId?: string;
}
export declare function VariablesRoute(props: RouteProps): JSX.Element | null;
interface Props {
    sessionId: string;
    entity: StudyEntity;
    variable: StudyVariable;
}
export declare function Variables(props: Props): JSX.Element | null;
export {};
//# sourceMappingURL=Variables.d.ts.map