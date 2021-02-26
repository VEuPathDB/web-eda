import React from 'react';
import { SubsettingClient } from '../api/eda-api';
import { SessionClient } from '../api/session-api';
export interface Props {
    studyId: string;
    sessionId: string;
    children: React.ReactChild | React.ReactChild[];
    className?: string;
    sessionClient: SessionClient;
    subsettingClient: SubsettingClient;
    makeVariableLink?: (entityId: string, variableId: string) => string;
}
export declare function EDAWorkspaceContainer(props: Props): JSX.Element | null;
//# sourceMappingURL=EDAWorkspaceContainer.d.ts.map