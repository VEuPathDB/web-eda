import { useState } from 'react';
import { SemiTransparentHeaderLogoProps } from './SemiTransparentHeader';
import { ChevronRight } from '@veupathdb/coreui';
import { Launch, LockOpen } from '@material-ui/icons';

export type MapSideNavigationProps = {
  children: React.ReactNode;
  logoProps: SemiTransparentHeaderLogoProps;
};

const navigationItems: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
};

const menuBackground = 'rgba(255, 255, 255, 0.8)';

const bottomLinkStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  fontSize: 15,
  marginBottom: '1rem',
};

const siteAccent = 'rgba(197, 223, 207, 0.5)';

export function MapSideNavigation({
  logoProps,
  children,
}: MapSideNavigationProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <nav
      style={{
        background: menuBackground,
        height: 'calc(100% - 200px)',
        left: isExpanded ? 0 : -200,
        minHeight: 125,
        position: 'absolute',
        top: 150,
        transition: 'left 0.1s ease',
        width: 200,
        zIndex: 150,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'space-between',
        }}
      >
        <h2
          style={{
            margin: 0,
            padding: '1rem 0',
            textAlign: 'center',
            background: siteAccent,
          }}
        >
          {logoProps.siteName}
        </h2>
        <div style={{ height: '80%', overflow: 'scroll', ...navigationItems }}>
          {children}
        </div>
        <hr
          style={{
            width: '90%',
            marginBottom: '1.5rem',
            backgroundColor: `rgba(0, 0, 0,0.25)`,
            border: 0,
            height: '1px',
          }}
        />
        <div
          style={{
            // This handles short viewports. These styles allow
            // content inside the div to be scrollable if it exceeds the
            // height contraints of a short viewport.
            marginLeft: '0.5rem',
            height: '100%',
            minHeight: '30px',
            overflow: 'scroll',
            // This pins the items to the bottom of the navigation
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <a style={bottomLinkStyles} href={logoProps.href}>
            <Launch />
            <p style={{ margin: '0 0 0 5px' }}>{logoProps.siteName} home</p>
          </a>
          {/* 👇 Don't hardcode this. */}
          <a
            style={bottomLinkStyles}
            href="https://eupathdb.org/oauth/assets/eupathdb-login.html"
          >
            <LockOpen />
            <p style={{ margin: '0 0 0 5px' }}>Login</p>
          </a>
        </div>
      </div>
      <button
        style={{
          position: 'absolute',
          right: -50,
          bottom: '50%',
          transform: 'translate(0%, -50%)',
          width: 50,
          height: 50,
          borderColor: 'transparent',
          background: menuBackground,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.1s ease',
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
    </nav>
  );
}
