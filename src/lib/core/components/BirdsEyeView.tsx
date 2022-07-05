import { EntityCounts } from '../hooks/entityCounts';
import { CoverageStatistics } from '../types/visualization';
import BirdsEyePlot from '@veupathdb/components/lib/plots/BirdsEyePlot';
import { red, gray } from './filter/colors';
import { StudyEntity } from '../types/study';
import Tooltip from '@veupathdb/wdk-client/lib/Components/Overlays/Tooltip';

interface Props extends Partial<CoverageStatistics> {
  /** The output entity */
  outputEntity?: StudyEntity;
  /** Are any stratification variables active? */
  stratificationIsActive: boolean;
  /** Should the spinner be enabled? This doesn't mean that it is shown. Just that it might be. */
  enableSpinner?: boolean;
  totalCounts: EntityCounts | undefined;
  filteredCounts: EntityCounts | undefined;
}

export function BirdsEyeView(props: Props) {
  const {
    outputEntity,
    completeCasesAllVars,
    completeCasesAxesVars,
    stratificationIsActive,
    enableSpinner = false,
    totalCounts,
    filteredCounts,
  } = props;

  const outputEntityId = outputEntity?.id;

  const totalSize =
    totalCounts && outputEntityId ? totalCounts[outputEntityId] : undefined;
  const subsetSize =
    filteredCounts && outputEntityId
      ? filteredCounts[outputEntityId]
      : undefined;

  const birdsEyeData =
    completeCasesAxesVars != null &&
    completeCasesAllVars != null &&
    totalSize != null &&
    subsetSize != null
      ? {
          brackets: [
            {
              value: completeCasesAxesVars,
              label: 'Data for axes',
            },
            ...(stratificationIsActive
              ? [
                  {
                    value: completeCasesAllVars,
                    label: 'Data for axes & strata',
                  },
                ]
              : []),
          ],
          bars: [
            // total comes first, or the subset is hidden
            {
              label: 'Total',
              value: totalSize,
              color: gray,
            },
            {
              label: 'Subset',
              value: subsetSize,
              color: red,
            },
          ],
        }
      : undefined;

  const entityPluralString =
    outputEntity?.displayNamePlural ?? outputEntity?.displayName;

  const tooltipContent = (
    <div>
      {stratificationIsActive && completeCasesAllVars != null && (
        <>
          <b>Data for axes & strata:</b> {completeCasesAllVars.toLocaleString()}{' '}
          <i>{entityPluralString}</i> in the subset have data for all axis and
          stratification variables.
          <br />
        </>
      )}
      {completeCasesAxesVars != null && (
        <>
          <b>Data for axes:</b> {completeCasesAxesVars.toLocaleString()}{' '}
          <i>{entityPluralString}</i> in the subset have data for all axis
          variables.
          <br />
        </>
      )}
      {subsetSize != null && (
        <>
          <b>Subset:</b> {subsetSize.toLocaleString()}{' '}
          <i>{entityPluralString}</i> match the filters applied in this
          analysis.
          <br />
        </>
      )}
      {totalSize != null && (
        <>
          <b>All:</b> {totalSize.toLocaleString()}, the total number of{' '}
          <i>{entityPluralString}</i> in the dataset.
        </>
      )}
    </div>
  );

  return birdsEyeData ? (
    <div style={{ display: 'flex' }}>
      <BirdsEyePlot
        data={birdsEyeData}
        containerClass="birds-eye-plot"
        containerStyles={{
          width: '400px',
          height: '110px',
        }}
        spacingOptions={{
          marginTop: 5,
          marginBottom: 5,
          marginLeft: 5,
          marginRight: 5,
        }}
        interactive={true}
        dependentAxisLabel={entityPluralString}
        showSpinner={enableSpinner && !birdsEyeData}
      />
      <Tooltip
        content={tooltipContent}
        position={{
          my: 'middle middle',
          at: 'middle middle',
        }}
        showDelay={250}
        showTip={false}
      >
        <i
          style={{
            position: 'relative',
            right: '18px',
            top: '7px',
            height: '1rem',
            width: '1rem',
            fontSize: '0.95rem',
            cursor: 'default',
          }}
          className="fa fa-question-circle"
          aria-hidden="true"
        ></i>
      </Tooltip>
    </div>
  ) : (
    <div style={{ width: '400px', height: '110px' }}></div>
  );
}
