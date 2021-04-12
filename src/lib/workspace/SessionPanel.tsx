import React from 'react';
import { cx } from './Utils';
import { SessionSummary } from './SessionSummary';
import { Status, useSession } from '../core';
import WorkspaceNavigation from '@veupathdb/wdk-client/lib/Components/Workspace/WorkspaceNavigation';
import {
  Redirect,
  Route,
  RouteComponentProps,
  useRouteMatch,
} from 'react-router';
import { SubsettingRoute } from './Subsetting';
import { DefaultVariableRedirect } from './DefaultVariableRedirect';
import { ComputationRoute } from './ComputationRoute';

interface Props {
  sessionId: string;
}

export function SessionPanel(props: Props) {
  const { sessionId } = props;
  const sessionState = useSession(sessionId);
  const {
    status,
    session,
    setName,
    copySession,
    saveSession,
    deleteSession,
  } = sessionState;
  const { url: routeBase } = useRouteMatch();
  if (status === Status.Error)
    return (
      <div>
        <h2>Error</h2>
        <p>Could not load the analysis session.</p>
      </div>
    );
  if (session == null) return null;
  return (
    <div className={cx('-Session')}>
      <WorkspaceNavigation
        heading={
          <SessionSummary
            session={session}
            setSessionName={setName}
            copySession={copySession}
            saveSession={saveSession}
            deleteSession={deleteSession}
          />
        }
        routeBase={routeBase}
        items={[
          {
            display: 'Browse and subset',
            route: '/variables',
            exact: false,
          },
          {
            display: 'Visualize',
            route: '/visualizations',
            exact: false,
          },
        ]}
      />
      <Route
        path={routeBase}
        exact
        render={() => <Redirect to={`${routeBase}/variables`} />}
      />
      <Route
        path={`${routeBase}/variables`}
        exact
        render={() => <DefaultVariableRedirect />}
      />
      <Route
        path={`${routeBase}/variables/:entityId/:variableId`}
        render={(
          props: RouteComponentProps<{ entityId: string; variableId: string }>
        ) => (
          <SubsettingRoute
            sessionState={sessionState}
            {...props.match.params}
          />
        )}
      />
      <Route
        path={`${routeBase}/visualizations`}
        render={() => <ComputationRoute sessionState={sessionState} />}
      />
    </div>
  );
}
