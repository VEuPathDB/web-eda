import { makeClassNameHelper } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';

import { StudyEntity } from '../../types/study';
import { makeEntityDisplayName } from '../../utils/study-metadata';
//DKDK add icon and tooltip
// import WarningIcon from '@material-ui/icons/Warning';
import Tooltip from '@veupathdb/wdk-client/lib/Components/Overlays/Tooltip';
// use Banner from CoreUI for showing message for no smoothing
import SVGWarning from '@veupathdb/coreui/dist/components/icons/Warning';

interface Props {
  entity?: StudyEntity;
  outputSize?: number;
  //DKDK add axis truncation config
  axisTruncationConfig?: boolean[];
}

const cx = makeClassNameHelper('OutputEntityTitle');

//DKDK add axis truncation config
// export function OutputEntityTitle({ entity, outputSize }: Props) {
export function OutputEntityTitle({
  entity,
  outputSize,
  axisTruncationConfig,
}: Props) {
  //DKDK
  const isAxisTruncation = axisTruncationConfig?.some(
    (value: boolean) => value
  );
  const truncationHelp = 'truncated!!!';

  return (
    <p className={cx()}>
      {outputSize != null && <>{outputSize.toLocaleString()} </>}
      <span className={cx('-EntityName', entity == null && 'unselected')}>
        {entity != null
          ? makeEntityDisplayName(
              entity,
              outputSize == null || outputSize !== 1
            )
          : 'No entity selected'}
      </span>
      {/* DKDK add warning icon for axis truncation */}
      &nbsp;&nbsp;
      {isAxisTruncation && (
        <>
          <SVGWarning
            style={{ verticalAlign: 'middle' }}
            fill={'yellow'}
            // fontSize="medium"
          />
          &nbsp;
          <SVGWarning
            style={{ verticalAlign: 'middle' }}
            fill={'green'}
            // fontSize="medium"
          />
          &nbsp;
          <SVGWarning
            style={{ verticalAlign: 'middle' }}
            fill={'blue'}
            // fontSize="medium"
          />
          &nbsp;
          <Tooltip content={truncationHelp} showDelay={0}>
            {/* <WarningIcon
              style={{ color: 'black', verticalAlign: 'middle' }}
              fontSize="medium"
            /> */}
            <SVGWarning
              style={{ verticalAlign: 'middle' }}
              fill={'red'}
              // fontSize="medium"
            />
            {/* <i
              style={{ marginLeft: '0px', color: 'blue' }}
              className="fa fa-exclamation-triangle"
              aria-hidden="true"
              title="asdfasdfasdf"
            /> */}
            {/* <i
              style={{ marginLeft: '0px', color: 'blue' }}
              // className="fa fa-exclamation-triangle"
              className="fa fa-exclamation-circle"
              aria-hidden="true"
              title="asdfasdfasdf"
            /> */}
          </Tooltip>
          &nbsp;
          <i
            style={{ marginLeft: '0px', color: 'yellow' }}
            // className="fa fa-exclamation-triangle"
            className="fa fa-exclamation-circle"
            aria-hidden="true"
            title="asdfasdfasdf"
          />
          &nbsp;
          <i
            style={{ marginLeft: '0px', color: 'green' }}
            // className="fa fa-exclamation-triangle"
            className="fa fa-exclamation-circle"
            aria-hidden="true"
            title="asdfasdfasdf"
          />
          &nbsp;
          <i
            style={{ marginLeft: '0px', color: 'blue' }}
            // className="fa fa-exclamation-triangle"
            className="fa fa-exclamation-circle"
            aria-hidden="true"
            title="asdfasdfasdf"
          />
          &nbsp;
          <i
            style={{ marginLeft: '0px', color: 'red' }}
            // className="fa fa-exclamation-triangle"
            className="fa fa-exclamation-circle"
            aria-hidden="true"
            title="asdfasdfasdf"
          />
        </>
      )}
    </p>
  );
}
