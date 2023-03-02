import { ReactElement, ReactNode } from 'react';
import ArrowRight from '@veupathdb/coreui/dist/components/icons/ChevronRight';
import {
  makeClassNameHelper,
  safeHtml,
} from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import { SaveableTextEditor } from '@veupathdb/wdk-client/lib/Components';
import { ANALYSIS_NAME_MAX_LENGTH } from '../../core/utils/analysis';
import './MapNavigation.scss';

export type MapNavigationLogoProps = {
  href: string;
  siteName: string;
  src: string;
};

export type MapNavigationProps = {
  analysisName?: string;
  filterList?: ReactElement;
  isExpanded: boolean;
  logoProps: MapNavigationLogoProps;
  onAnalysisNameEdit: (newName: string) => void;
  onToggleExpand: () => void;
  studyName: string;
  totalEntitesInSampleCount: number | undefined;
  totalEntitiesInSubsetCount: number | undefined;
  visibleEntitiesCount: number | undefined;
};

/**
 * <SemiTransparentHeader /> has the following responsibilities:
 *  - Worrying about being collapsed/expanded.
 *  - Presenting the smallest amount of information to allow the user
 *    to make sense of a map analysis.
 */
export function MapNavigation({
  analysisName,
  filterList,
  isExpanded,
  logoProps,
  onAnalysisNameEdit,
  onToggleExpand,
  studyName,
  totalEntitesInSampleCount: totalEntitesInSample = 0,
  totalEntitiesInSubsetCount = 0,
  visibleEntitiesCount = 0,
}: MapNavigationProps) {
  const mapNavigation = makeClassNameHelper('SemiTransparentHeader');

  return (
    <header
      className={`${mapNavigation()} ${
        !isExpanded ? mapNavigation('--collapsed') : ''
      }`}
    >
      <div
        className={`${mapNavigation('__Contents')} ${
          isExpanded ? '' : 'screenReaderOnly'
        }`}
      >
        <div className={mapNavigation('__LogoContainer')}>
          <a href={logoProps.href}>
            <img src={logoProps.src} alt={logoProps.siteName} />
          </a>
        </div>
        <HeaderContent
          filterList={filterList}
          studyName={studyName}
          analysisName={analysisName}
          onAnalysisNameEdit={onAnalysisNameEdit}
        />
      </div>
      <div className={mapNavigation('__SampleCounter')}>
        <table>
          <thead>
            <tr>
              <th title="Counts"></th>
              <th title="Values">Samples</th>
            </tr>
          </thead>
          <tbody>
            <tr title={`There are X total samples.`}>
              <td>All</td>
              <td>{totalEntitesInSample}</td>
            </tr>
            <tr
              title={`You've subset all samples down to ${totalEntitiesInSubsetCount} entites.`}
            >
              <td>Subset</td>
              <td>{totalEntitiesInSubsetCount}</td>
            </tr>
            <tr
              title={`${visibleEntitiesCount} samples of your subset samples visible at your current viewport.`}
            >
              <td>Visible</td>
              <td>{visibleEntitiesCount}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <OpenCloseToggleButton
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />
    </header>
  );
}

type HeaderContentProps = {
  analysisName?: string;
  filterList?: ReactNode;
  onAnalysisNameEdit: (newName: string) => void;
  studyName: string;
};
function HeaderContent({
  analysisName = '',
  filterList,
  onAnalysisNameEdit,
  studyName,
}: HeaderContentProps) {
  const headerContent = makeClassNameHelper('HeaderContent');

  return (
    <div className={headerContent()}>
      <div className={headerContent('__SaveableTextEditorContainer')}>
        <SaveableTextEditor
          displayValue={(value: string, handleEdit: () => void) => {
            return (
              <h1
                className={headerContent('__AnalysisTitle')}
                onClick={handleEdit}
              >
                <span
                  // This allows users to highlight the study name,
                  // without editing the analysis name.
                  onClick={(e) => e.stopPropagation()}
                  className={headerContent('__StudyName')}
                >
                  {safeHtml(studyName, { style: { fontWeight: 'bold' } })}:{' '}
                </span>
                <span>{analysisName}</span>
              </h1>
            );
          }}
          maxLength={ANALYSIS_NAME_MAX_LENGTH}
          onSave={onAnalysisNameEdit}
          value={analysisName}
        />
      </div>
      {filterList}
    </div>
  );
}

type OpenCloseToggleButtonProps = {
  isExpanded: boolean;
  onToggleExpand: () => void;
};
function OpenCloseToggleButton({
  isExpanded,
  onToggleExpand,
}: OpenCloseToggleButtonProps) {
  const expandToggleContainer = makeClassNameHelper('OpenCloseToggleButton');
  return (
    <div className={expandToggleContainer()}>
      <button
        className={`Button ${
          isExpanded ? '' : expandToggleContainer('--collapsed')
        }`}
        onClick={onToggleExpand}
      >
        <div
          className={`${expandToggleContainer('__SvgContainer')} ${
            isExpanded ? '' : expandToggleContainer('__SvgContainer--collapsed')
          }`}
          aria-hidden
        >
          <ArrowRight
            className={`${expandToggleContainer('__ArrowIcon')} ${
              isExpanded ? '' : expandToggleContainer('__ArrowIcon--collapsed')
            }`}
          />
        </div>

        <span className="screenReaderOnly">
          {isExpanded ? 'Close' : 'Open'} header.
        </span>
      </button>
    </div>
  );
}
