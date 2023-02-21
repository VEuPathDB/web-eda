import React, { ReactElement, ReactNode } from 'react';
import ArrowRight from '@veupathdb/coreui/dist/components/icons/ChevronRight';
import {
  makeClassNameHelper,
  safeHtml,
} from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import { SaveableTextEditor } from '@veupathdb/wdk-client/lib/Components';
import { ANALYSIS_NAME_MAX_LENGTH } from '../../core/utils/analysis';
import './SemiTransparentHeader.scss';

export type SemiTransparentHeaderProps = {
  analysisName?: string;
  filterList?: ReactElement;
  isExpanded: boolean;
  logoProps: LogoProps;
  onAnalysisNameEdit: (newName: string) => void;
  onToggleExpand: () => void;
  studyName: string;
  style?: React.CSSProperties;
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
        <div style={{ margin: '0 1.5rem 0 1.5rem' }}>
          <Logo
            siteName={logoProps.src}
            href={logoProps.href}
            src={logoProps.src}
          />
        </div>
        <div>
          <BannerContent
            filterList={filterList}
            studyName={studyName}
            analysisName={analysisName}
            onAnalysisNameEdit={onAnalysisNameEdit}
          />
        </div>
      </div>
      <div style={{ marginRight: '1rem', fontSize: 16 }}>
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

export type LogoProps = {
  href: string;
  src: string;
  siteName: string;
};
function Logo({ href, siteName, src }: LogoProps) {
  return (
    <a href={href}>
      <img
        style={{ borderRadius: '50%', height: 65 }}
        src={src}
        alt={siteName}
      />
    </a>
  );
}

type BannerContentProps = {
  analysisName?: string;
  filterList?: ReactNode;
  onAnalysisNameEdit: (newName: string) => void;
  studyName: string;
};
function BannerContent({
  analysisName,
  filterList,
  studyName,
  onAnalysisNameEdit,
}: BannerContentProps) {
  if (!analysisName) return <></>;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 19,
            }}
          >
            <SaveableTextEditor
              displayValue={(value: string, handleEdit: () => void) => {
                return (
                  <h1
                    onClick={handleEdit}
                    style={{
                      fontStyle: 'italic',
                      padding: '10px 0',
                      fontSize: 19,
                    }}
                  >
                    <span
                      // This allows users to highlight the study name,
                      // without editing the analysis name.
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'default' }}
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
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            fontWeight: 'normal',
          }}
        >
          {filterList}
        </div>
      </div>
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
