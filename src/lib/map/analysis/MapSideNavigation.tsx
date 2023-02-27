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
        width: 200,
        position: 'absolute',
        left: isExpanded ? 0 : -200,
        top: 150,
        height: 'calc(100% - 200px)',
        minHeight: 125,
        zIndex: 150,
        transition: 'left 0.15s ease',
        // transition: 'left 0.7s cubic-bezier(1,-3.99,0,2.58)',
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
        <div style={{ marginLeft: '0.5rem' }}>
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
