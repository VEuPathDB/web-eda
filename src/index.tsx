import './globals';
import { endpoint, rootElement, rootUrl } from './constants';
import React from 'react';
// import './index.css';
import reportWebVitals from './reportWebVitals';
// import { initialize } from '@veupathdb/wdk-client/lib/Core';
import { initialize } from '@veupathdb/web-common/lib/bootstrap';
import { RouteEntry } from '@veupathdb/wdk-client/lib/Core/RouteEntry';
import { RouteComponentProps } from 'react-router';
import { EDAAnalysisList, EDAWorkspace } from './lib';

import '@veupathdb/wdk-client/lib/Core/Style/index.scss';
import '@veupathdb/web-common/lib/styles/client.scss';
import Header from './Header';

initialize({
  rootUrl,
  rootElement,
  wrapRoutes: (routes: any): RouteEntry[] => [
    {
      path: '/eda/:studyId/:analysisId',
      component: (
        props: RouteComponentProps<{ studyId: string; analysisId: string }>
      ) => <EDAWorkspace {...props.match.params} />,
    },
    {
      path: '/eda/:studyId',
      component: (props: RouteComponentProps<{ studyId: string }>) => (
        <EDAAnalysisList studyId={props.match.params.studyId} />
      ),
    },
    ...routes,
  ],
  componentWrappers: {
    SiteHeader: () => Header,
  },
  endpoint,
} as any);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
