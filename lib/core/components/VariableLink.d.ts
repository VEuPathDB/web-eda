import { LinkProps } from 'react-router-dom';
export interface Props<S = unknown> extends Omit<LinkProps<S>, 'to'> {
    entityId: string;
    variableId: string;
}
export declare function VariableLink(props: Props): JSX.Element;
//# sourceMappingURL=VariableLink.d.ts.map