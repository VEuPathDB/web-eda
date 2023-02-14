import React from 'react';
import ArrowRight from '@veupathdb/coreui/dist/components/icons/ChevronRight';
import './SemiTransparentBanner.scss';

export type SemiTransparentBannerProps = {
  style?: React.CSSProperties;
  isExpanded: boolean;
  onToggleExpand: () => void;
};
export function SemiTransparentBanner({
  isExpanded,
  style,
  onToggleExpand,
}: SemiTransparentBannerProps) {
  return (
    <div
      className={`SemiTransparentBanner ${
        !isExpanded ? 'SemiTransparentBanner__collapsed' : ''
      }`}
    >
      <div className={isExpanded ? '' : 'screenReaderOnly'}>
        <h1>title</h1>
      </div>
      <div className="ExpandToggleContainer">
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
              className={`ArrowIcon ${
                isExpanded ? '' : 'ArrowIcon__collapsed'
              }`}
            />
          </div>
          <span className="screenReaderOnly">
            {isExpanded ? 'Close' : 'Open'} header.
          </span>
        </button>
      </div>
    </div>
  );
}
