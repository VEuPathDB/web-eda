import React, { ReactElement, ReactNode } from 'react';
import ArrowRight from '@veupathdb/coreui/dist/components/icons/ChevronRight';
import Filter from '@veupathdb/coreui/dist/components/icons/Filter';
import './SemiTransparentBanner.scss';
import { safeHtml } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import { Chip, FilledButton, Pencil } from '@veupathdb/coreui';
import { ChevronLeft, ChevronRight } from '@material-ui/icons';
import FilterChipList from '../../core/components/FilterChipList';
import { SaveableTextEditor } from '@veupathdb/wdk-client/lib/Components';
import { ANALYSIS_NAME_MAX_LENGTH } from '../../core/utils/analysis';

export type SemiTransparentBannerProps = {
  analysisName?: string;
  filterList: () => ReactElement;
  isExpanded: boolean;
  onAnalysisNameEdit: (newName: string) => void;
  onToggleExpand: () => void;
  studyName: string;
  style?: React.CSSProperties;
  totalEntitesCount: number | undefined;
  visibleEntitiesCount: number | undefined;
  logoProps: LogoProps;
};
export function SemiTransparentBanner({
  analysisName,
  filterList,
  isExpanded,
  onAnalysisNameEdit,
  onToggleExpand,
  studyName,
  style,
  totalEntitesCount,
  visibleEntitiesCount,
  logoProps,
}: SemiTransparentBannerProps) {
  return (
    /**
     * The banner role is for defining a global site header, which usually
     * includes a logo, company name, search feature, and possibly the global
     * navigation or a slogan.
     *
     * It is generally located at the top of the page. By default, the HTML's
     * <header> element has an identical meaning to the banner landmark, unless
     * it is a descendant of <aside>, <article>, <main>, <nav>, or <section>, at
     * which point <header> exposes a generic role, and not the equivalent of the
     * site-wide banner.
     */
    <header
      className={`SemiTransparentBanner ${
        // TODO: Rename everything to BEM
        // TODO: Use the `makeClassNameHelper` util in this repo.
        !isExpanded ? 'SemiTransparentBanner__collapsed' : ''
      }`}
    >
      <div
        className={`SemiTransparentBanner__Contents ${
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
  studyName: string;
  filterList: () => ReactElement;
  onAnalysisNameEdit: (newName: string) => void;
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
          {filterList()}
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
  return (
    <div
      className={`ExpandToggleContainer ${
        isExpanded ? '' : 'ExpandToggleContainer--collapsed'
      }`}
    >
      <button
        className={`ExpandToggleButton ${
          isExpanded ? '' : 'ExpandToggleButton__collapsed'
        }`}
        onClick={onToggleExpand}
      >
        <div
          className={`SvgContainer ${
            isExpanded ? '' : 'SvgContainer__collapsed'
          }`}
          aria-hidden
        >
          <ArrowRight
            className={`ArrowIcon ${isExpanded ? '' : 'ArrowIcon__collapsed'}`}
          />
        </div>

        <span className="screenReaderOnly">
          {isExpanded ? 'Close' : 'Open'} header.
        </span>
      </button>
    </div>
  );
}
