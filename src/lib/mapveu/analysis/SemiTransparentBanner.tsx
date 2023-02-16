import React from 'react';
import ArrowRight from '@veupathdb/coreui/dist/components/icons/ChevronRight';
import Filter from '@veupathdb/coreui/dist/components/icons/Filter';
import './SemiTransparentBanner.scss';
import { safeHtml } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import { Chip, FilledButton, Pencil } from '@veupathdb/coreui';
import { ChevronLeft, ChevronRight } from '@material-ui/icons';
import FilterChipList from '../../core/components/FilterChipList';

export type SemiTransparentBannerProps = {
  analysisName?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  studyName: string;
  style?: React.CSSProperties;
  totalEntitesCount: number | undefined;
  visibleEntitiesCount: number | undefined;
};
export function SemiTransparentBanner({
  analysisName,
  studyName,
  totalEntitesCount,
  visibleEntitiesCount,
  isExpanded,
  onToggleExpand,
  style,
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
          <Logo />
        </div>
        <div>
          <BannerContent studyName={studyName} analysisName={analysisName} />
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

function Logo() {
  return (
    <a href="https://google.com">
      <img
        style={{ borderRadius: '50%' }}
        src="https://via.placeholder.com/50.png"
        alt="Site Name Here"
      />
    </a>
  );
}

type BannerContentProps = {
  analysisName?: string;
  studyName: string;
};
function BannerContent({ analysisName, studyName }: BannerContentProps) {
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
            paddingBottom: '0.5rem',
          }}
        >
          <h1
            style={{
              fontSize: '19px',
              fontStyle: 'italic',
              padding: 0,
            }}
          >
            {safeHtml(studyName, { style: { fontWeight: 'bold' } })}:{' '}
            <span>{analysisName}</span>
          </h1>
          <div style={{ display: 'flex', marginLeft: '0.5rem' }}>
            <Pencil aria-hidden fontSize={19} fill="#6C8A9A" />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '0.5rem',
            fontWeight: 'normal',
          }}
        >
          <FiltersList
            filters={Array(3)
              // filters={Array(8)
              // filters={Array(38)
              .fill(0)
              .map((i, idx) => i + idx)}
          />
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
      <div className="ExpandToggleContainer__HoverIndicator" aria-hidden></div>
    </div>
  );
}

type FiltersListProps = {
  filters: number[];
};
function FiltersList({ filters }: FiltersListProps) {
  if (!filters || filters.length < 1) {
    return <p>No filters applied.</p>;
  }
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <p style={{ margin: 0, fontSize: '17px', fontWeight: 500 }}>
        Filters{filters.length > 5 && ` (${filters.length})`}:{' '}
      </p>
      <div
        style={{
          maxHeight: 50,
          overflow: 'scroll',
        }}
      >
        <ul
          style={{
            listStyleType: 'none',
            display: 'flex',
            flexFlow: 'wrap row',
            margin: 0,
            padding: '0.25rem 0',
          }}
        >
          {filters.map((i) => (
            <li
              style={{
                margin: '0 0.25rem',
              }}
              key={i}
            >
              <Chip text={`Filter Number: ${i + 1}`} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
