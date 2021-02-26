import React from 'react';
import { SessionClient } from '../api/session-api';
import { SubsettingClient } from '../api/eda-api';
interface Props {
    studyId: string;
    children: React.ReactChild | React.ReactChild[];
    className?: string;
    sessionClient: SessionClient;
    subsettingClient: SubsettingClient;
}
export declare function EDASessionListContainer(props: Props): JSX.Element | null;
export {};
//# sourceMappingURL=EDASessionListContainer.d.ts.map