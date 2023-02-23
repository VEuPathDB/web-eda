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
        left: isExpanded ? 0 : 100,
        top: 130,
        height: '80%',
        zIndex: 150,
        // transform: `translate(0%, 50%)`,
      }}
    >
      <div
        style={{
          height: '100%',
          position: 'relative',
          overflow: 'scroll',
        }}
      >
        <h2>{siteName}</h2>
        <ul>
          {Array(50)
            .fill(0)
            .map((_, idx) => idx)
            .map((idx) => (
              <li key={idx}>Item {idx}</li>
            ))}
        </ul>
      </div>
      <button
        style={{
          position: 'absolute',
          top: 50,
          right: 50,
          transform: 'translate(-50%, -50%)',
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
