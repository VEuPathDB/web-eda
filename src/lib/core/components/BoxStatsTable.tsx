import React from 'react';
import { PromiseHookState } from '../hooks/promise';
import { Variable } from '../types/study';
import { BoxplotDataWithCoverage } from './visualizations/implementations/BoxplotVisualization';

export interface Props {
  data: PromiseHookState<BoxplotDataWithCoverage | undefined>;
  // descriptor?: any,
  xAxisVariable?: Variable;
  overlayVariable?: Variable;
  facetVariable?: Variable;
}

export function BoxStatsTable({
  data,
  // descriptor,
  xAxisVariable,
  overlayVariable,
  facetVariable,
}: Props) {
  return (
    <div
      className={'BoxStatsTable'}
      style={{ marginTop: 15, marginLeft: '0.75rem' }}
    >
      <table>
        <tbody>
          <tr>
            <th>{'X-axis'}</th>
            {facetVariable != null ? <th>{'Facet'}</th> : null}
            <th>{'Parameter'}</th>
            <th>{'Statistic'}</th>
            <th>{'p-value'}</th>
            <th>{'Method'}</th>
          </tr>
          {data.value?.statsTable?.map((data: any) => (
            <tr>
              <td>
                {overlayVariable != null
                  ? data.xVariableDetails?.value
                  : xAxisVariable?.displayName}
              </td>
              {facetVariable != null ? (
                <td>
                  {data.facetVariableDetails != null
                    ? data.facetVariableDetails[0].value
                    : ''}
                </td>
              ) : null}
              <td>
                {data.parameter != null && data.parameter.length !== 0
                  ? data.parameter
                  : 'N/A'}
              </td>
              <td>
                {data.statistic != null && data.statistic.length !== 0
                  ? data.statistic
                  : 'N/A'}
              </td>
              <td>
                {data.pvalue != null && data.pvalue.length !== 0
                  ? data.pvalue
                  : 'N/A'}
              </td>
              <td>
                {data.method != null && data.method.length !== 0
                  ? data.method
                  : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
