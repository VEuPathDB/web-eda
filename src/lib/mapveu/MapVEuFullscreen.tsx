import { useHistory } from 'react-router';
import MapVEuMap from '@veupathdb/components/lib/map/MapVEuMap';
import geohashAnimation from '@veupathdb/components/lib/map/animation_functions/geohash';
import { defaultAnimationDuration } from '@veupathdb/components/lib/map/config/map';

export const MapVEuFullscreen = () => {
  const history = useHistory();
  const defaultAnimation = {
    method: 'geohash',
    animationFunction: geohashAnimation,
    duration: defaultAnimationDuration,
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'white',
      }}
      onKeyUp={(event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') history.goBack();
      }}
    >
      <button
        onClick={history.goBack}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          margin: 5,
          padding: 10,
          zIndex: 1000,
        }}
      >
        ← Back to EDA
      </button>
      <MapVEuMap
        height="100%"
        width="100%"
        viewport={{ center: [0, 0], zoom: 2 }}
        onViewportChanged={() => {}}
        onBoundsChanged={() => {}}
        markers={[]}
        animation={defaultAnimation}
        mouseMode="default"
        onMouseModeChange={() => {}}
      />
    </div>
  );
};
