import React from 'react';
import { SessionState, StudyEntity } from '../../../core';
import * as HistogramPlot from '@veupathdb/components/lib/plots/Histogram';

interface Props {
  sessionState: SessionState;
  entities: StudyEntity[];
}

export default function Histogram(props: Props) {
  return (
    <div>
      <pre>What a histogram!</pre>
    </div>
  );
}
