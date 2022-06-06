import React, { useMemo } from 'react';
import { PromiseHookState } from '../hooks/promise';
import { StudyEntity, Variable } from '../types/study';
import { BoxplotDataWithCoverage } from './visualizations/implementations/BoxplotVisualization';
import { BoxplotStatsTable } from '../api/DataClient/types';
import { fixVarIdLabel } from '../utils/visualization';

export interface Props {
  data: PromiseHookState<BoxplotDataWithCoverage | undefined>;
  entities?: StudyEntity[];
  descriptor?: { type: string; configuration: unknown };
  xAxisVariable?: Variable;
  overlayVariable?: Variable;
  facetVariable?: Variable;
}

export function BoxStatsTable({
  data,
  entities,
  descriptor,
  xAxisVariable,
  overlayVariable,
  facetVariable,
}: Props) {
  const collectionVariableDetails = useMemo(
    () =>
      data?.value?.computedVariableMetadata?.collectionVariable
        ?.collectionVariableDetails,
    [data]
  );

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
          {data.value?.statsTable?.map((data: BoxplotStatsTable) => (
            <tr>
              <td>
                {descriptor?.type === 'abundance'
                  ? collectionVariableDetails && entities
                    ? fixVarIdLabel(
                        data.xVariableDetails?.value ?? '',
                        collectionVariableDetails,
                        entities
                      )
                    : data.xVariableDetails?.value
                  : overlayVariable != null
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
                {data.parameter != null &&
                (data.parameter as number[]).length !== 0
                  ? data.parameter
                  : 'N/A'}
              </td>
              <td>
                {data.statistic != null &&
                (data.statistic as number[]).length !== 0
                  ? data.statistic
                  : 'N/A'}
              </td>
              <td>
                {data.pvalue != null && (data.pvalue as number[]).length !== 0
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
