import { useState } from 'react';
import { MapNavigationLogoProps } from './MapNavigation';
import { ChevronRight } from '@veupathdb/coreui';
import { Launch, LockOpen } from '@material-ui/icons';

export type MapSideNavigationProps = {
  children: React.ReactNode;
  logoProps: MapNavigationLogoProps;
};

const menuBackground = 'rgba(255, 255, 255, 0.8)';

const bottomLinkStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  fontSize: 15,
  marginBottom: '1rem',
};

const siteAccent = 'rgba(197, 223, 207, 1)';

export function MapSideNavigation({
  logoProps,
  children,
}: MapSideNavigationProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <nav
      style={{
        // These styles define the look of the navigation,
        // including its width, height, and location on the
        // page (which depends on the `isExpanded` piece of state.
        background: menuBackground,
        // height: 'calc(100% - 150px)',
        height: '100%',
        left: isExpanded ? 0 : -200,
        minHeight: 125,
        position: 'relative',
        transition: 'left 0.1s ease',
        width: 200,
        pointerEvents: 'auto',
        marginTop: '2rem',
      }}
    >
      <button
        style={{
          // This makes the button
          background: menuBackground,
          borderColor: 'transparent',
          height: 50,
          width: 50,
          // These styles pin the expand/collapse to the right of
          // the lefthand side menu at the nav's vertical center.
          position: 'absolute',
          right: -50,
          top: '50%',
          transform: 'translate(0%, -50%)',
          transition: 'all 0.1s ease',
          // These styles make sure that the button's SVG
          // is centered on x and y-axis.
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <ChevronRight
          style={{
            transform: `rotate(${isExpanded ? -180 : 0}deg)`,
            height: 30,
            width: 40,
          }}
          aria-hidden
        />
        <span className="screenReaderOnly">
          {isExpanded ? 'Close' : 'Open'} {logoProps.siteName} side menu
        </span>
      </button>
      <div
        style={{
          // The navigation items are put into a container
          // which takes up 100% of available space and
          // allows users to scroll through navigation whenever
          // there are lots of navigation items and/or the user's
          // viewport is short.
          height: '100%',
          overflowY: 'scroll',
          position: 'relative',
        }}
      >
        <h2 style={{ textAlign: 'center', background: siteAccent }}>
          Mission Control
        </h2>
        <div
          style={{
            // This ensures that the children nav items are contained to
            // 70% of the navigation, leaving 30% for the navigation
            // footer items.
            height: '70%',
            overflow: 'scroll',
          }}
        >
          {children}
        </div>
        <hr
          style={{
            // Styles for the <hr />
            backgroundColor: `rgba(0, 0, 0,0.25)`,
            border: 0,
            height: '1px',
            marginBottom: '1.5rem',
            width: '90%',
          }}
        />
        <div
          style={{
            // This handles short viewports. These styles allow
            // content inside the div to be scrollable if it exceeds the
            // height contraints of a short viewport.
            marginLeft: '0.5rem',
            // This pins the items to the bottom of the navigation
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <ul style={{ margin: 0, padding: 0, listStyleType: 'none' }}>
            <li>
              <a style={bottomLinkStyles} href={logoProps.href}>
                <Launch />
                <p style={{ margin: '0 0 0 5px' }}>{logoProps.siteName} home</p>
              </a>
            </li>
            <li>
              <a
                style={bottomLinkStyles}
                // {/* 👇 Don't hardcode this. */}
                href="https://eupathdb.org/oauth/assets/eupathdb-login.html"
              >
                <LockOpen />
                <p style={{ margin: '0 0 0 5px' }}>Login</p>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
