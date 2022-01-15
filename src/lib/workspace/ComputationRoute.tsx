import React, { useCallback } from 'react';
import { Route, Switch, useHistory } from 'react-router';
import { Link, useRouteMatch } from 'react-router-dom';
import { AnalysisState, useDataClient } from '../core';
import { ComputationInstance } from '../core/components/computations/ComputationInstance';
import { plugin as alphadiv } from '../core/components/computations/plugins/alphaDiv';
import { plugin as pass } from '../core/components/computations/plugins/pass';
import { StartPage } from '../core/components/computations/StartPage';
import { ComputationPlugin } from '../core/components/computations/Types';
import { createComputation } from '../core/components/computations/Utils';
import { PromiseResult } from '../core/components/Promise';
import { EntityCounts } from '../core/hooks/entityCounts';
import { PromiseHookState, usePromise } from '../core/hooks/promise';

export interface Props {
  analysisState: AnalysisState;
  totalCounts: PromiseHookState<EntityCounts>;
  filteredCounts: PromiseHookState<EntityCounts>;
}

const plugins: Record<string, ComputationPlugin> = {
  pass,
  alphadiv,
};

/**
 * Handles delegating to a UI component based on the route.
 */
export function ComputationRoute(props: Props) {
  const { analysisState } = props;
  const { url } = useRouteMatch();
  const history = useHistory();
  const dataClient = useDataClient();
  const promiseState = usePromise(
    useCallback(() => dataClient.getApps(), [dataClient])
  );

  return (
    <PromiseResult state={promiseState}>
      {({ apps }) => (
        <Switch>
          <Route exact path={url}>
            <StartPage baseUrl={url} apps={apps} {...props} />
            <div>
              <h2>Saved apps</h2>
              <ul>
                {analysisState.analysis?.descriptor.computations.map((c) => (
                  <Link to={`${url}/${c.computationId}`}>
                    {c.displayName ?? 'No name'} &mdash; {c.descriptor.type}
                  </Link>
                ))}
              </ul>
            </div>
          </Route>
          {apps.map((app) => {
            const plugin = plugins[app.name];
            const addComputation = (name: string, configuration: unknown) => {
              if (analysisState.analysis == null) return;
              const computations =
                analysisState.analysis.descriptor.computations;
              const computation = createComputation(
                app,
                name,
                configuration,
                computations
              );
              analysisState.setComputations([computation, ...computations]);
              history.push(`${url}/${computation.computationId}`);
            };

            return (
              <Route exact path={`${url}/new/${app.name}`}>
                {plugin ? (
                  <plugin.configurationComponent
                    {...props}
                    computationAppOverview={app}
                    addNewComputation={addComputation}
                  />
                ) : (
                  <div>App not yet implemented</div>
                )}
              </Route>
            );
          })}
          <Route
            path={`${url}/:id`}
            render={(routeProps) => {
              const computation = props.analysisState.analysis?.descriptor.computations.find(
                (c) => c.computationId === routeProps.match.params.id
              );
              const app = apps.find(
                (app) => app.name === computation?.descriptor.type
              );
              const plugin = app && plugins[app.name];
              if (app == null || plugin == null)
                return <div>Cannot find app!</div>;
              return (
                <ComputationInstance
                  {...props}
                  computationId={routeProps.match.params.id}
                  computationAppOverview={app}
                  visualizationTypes={plugin.visualizationTypes}
                />
              );
            }}
          />
        </Switch>
      )}
    </PromiseResult>
  );
}
