import { ReactElement, ReactNode } from 'react';
import ArrowRight from '@veupathdb/coreui/dist/components/icons/ChevronRight';
import {
  makeClassNameHelper,
  safeHtml,
} from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import { SaveableTextEditor } from '@veupathdb/wdk-client/lib/Components';
import { ANALYSIS_NAME_MAX_LENGTH } from '../../core/utils/analysis';
import './SemiTransparentHeader.scss';

export type SemiTransparentHeaderLogoProps = {
  href: string;
  siteName: string;
  src: string;
};

export type SemiTransparentHeaderProps = {
  analysisName?: string;
  filterList?: ReactElement;
  isExpanded: boolean;
  logoProps: SemiTransparentHeaderLogoProps;
  onAnalysisNameEdit: (newName: string) => void;
  onToggleExpand: () => void;
  studyName: string;
  totalEntitesCount: number | undefined;
  visibleEntitiesCount: number | undefined;
};

/**
 * <SemiTransparentHeader /> has the following responsibilities:
 *  - Worrying about being collapsed/expanded.
 *  - Presenting the smallest amount of information to allow the user
 *    to make sense of a map analysis.
 */
export function SemiTransparentHeader({
  analysisName,
  filterList,
  isExpanded,
  logoProps,
  onAnalysisNameEdit,
  onToggleExpand,
  studyName,
  totalEntitesCount,
  visibleEntitiesCount,
}: SemiTransparentHeaderProps) {
  const semiTransparentHeader = makeClassNameHelper('SemiTransparentHeader');

  return (
    <header
      className={`${semiTransparentHeader()} ${
        !isExpanded ? semiTransparentHeader('--collapsed') : ''
      }`}
    >
      <div
        className={`${semiTransparentHeader('__Contents')} ${
          isExpanded ? '' : 'screenReaderOnly'
        }`}
      >
        <div className={semiTransparentHeader('__LogoContainer')}>
          <a href={logoProps.href}>
            <img src={logoProps.src} alt={logoProps.siteName} />
          </a>
        </div>
        <BannerContent
          filterList={filterList}
          studyName={studyName}
          analysisName={analysisName}
          onAnalysisNameEdit={onAnalysisNameEdit}
        />
      </div>
      <div className={semiTransparentHeader('__SampleCounter')}>
        <p>
          {visibleEntitiesCount} of {totalEntitesCount} samples visible
        </p>
      </div>
      <ExpandCollapseButton
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />
    </header>
  );
}

type BannerContentProps = {
  analysisName?: string;
  filterList?: ReactNode;
  onAnalysisNameEdit: (newName: string) => void;
  studyName: string;
};
function BannerContent({
  analysisName = '',
  filterList,
  studyName,
  onAnalysisNameEdit,
}: BannerContentProps) {
  const bannerContent = makeClassNameHelper('BannerContent');

  return (
    <div className={bannerContent()}>
      <div className={bannerContent('__SaveableTextEditorContainer')}>
        <SaveableTextEditor
          displayValue={(value: string, handleEdit: () => void) => {
            return (
              <h1
                className={bannerContent('__AnalysisTitle')}
                onClick={handleEdit}
              >
                <span
                  // This allows users to highlight the study name,
                  // without editing the analysis name.
                  onClick={(e) => e.stopPropagation()}
                  className={bannerContent('__StudyName')}
                >
                  {safeHtml(studyName, { style: { fontWeight: 'bold' } })}:{' '}
                </span>
                <span>{analysisName}</span>
              </h1>
            );
          }}
          value={analysisName}
          onSave={onAnalysisNameEdit}
          maxLength={ANALYSIS_NAME_MAX_LENGTH}
        />
      </div>
      {filterList}
    </div>
  );
}

type ExpandCollapseButtonProps = {
  isExpanded: boolean;
  onToggleExpand: () => void;
};
function ExpandCollapseButton({
  isExpanded,
  onToggleExpand,
}: ExpandCollapseButtonProps) {
  const expandToggleContainer = makeClassNameHelper('ExpandToggleContainer');
  return (
    <div className={expandToggleContainer()}>
      <button
        className={`ExpandToggleButton ${
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
