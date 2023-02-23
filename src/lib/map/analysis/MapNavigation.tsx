import { useState } from 'react';

export function MapNavigation() {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const siteName = 'Site Name';

  return (
    <nav
      style={{
        background: 'hotpink',
        width: 150,
        position: 'absolute',
        left: isExpanded ? 0 : -150,
        top: 150,
        height: 'calc(100% - 200px)',
        minHeight: 125,
        zIndex: 150,
        transition: 'left 0.7s cubic-bezier(1,-3.99,0,2.58)',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0, padding: 0 }}>{siteName}</h2>
        <div
          style={{
            height: '100%',
            overflow: 'scroll',
          }}
        >
          <ul>
            {Array(50)
              .fill(0)
              .map((_, idx) => idx)
              .map((idx) => (
                <li key={idx}>Item {idx}</li>
              ))}
          </ul>
        </div>
      </div>
      <button
        style={{
          position: 'absolute',
          right: -50,
          top: '50%',
          transform: 'translate(0%, -50%)',
          width: 50,
          height: 50,
        }}
        onClick={() => setIsExpanded((current) => !current)}
      >
        {isExpanded ? '👈' : '👉'}
        <span className="screenReaderOnly">
          {isExpanded ? 'Close' : 'Open'} {siteName} menu
        </span>
      </button>
    </nav>
  );
}
