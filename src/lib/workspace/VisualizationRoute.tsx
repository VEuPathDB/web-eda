import { useSession, useStudyMetadata } from '../core';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import React, { useEffect } from 'react';
import HistogramViz from '../core/components/visualizations/HistogramViz';

interface RouteProps {
  sessionId: string;
  visualizationName: string;
}

export default function VisualizationRoute(props: RouteProps) {
  const { sessionId } = props;
  const session = useSession(sessionId);
  const studyMetadata = useStudyMetadata();
  // const history = useHistory(); // TO DO?
  const entities = Array.from(
    preorder(studyMetadata.rootEntity, (e) => e.children || [])
  );

  // return the appropriate Visualization component
  switch (props.visualizationName) {
    case 'hello-world': {
      return (
        <HistogramViz
          studyMetadata={studyMetadata}
          sessionState={session}
          entities={entities}
        />
      );
    }
    default: {
      return <h3>Visualization not known or implemented</h3>;
    }
  }
}
