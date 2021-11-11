import { renderToStaticMarkup } from 'react-dom/server';

import { range, zipWith } from 'lodash';

import { isFacetedPlotRef } from '@veupathdb/components/lib/types/guards';
import { FacetedPlotRef, PlotRef } from '@veupathdb/components/lib/types/plots';

export interface ThumbnailDimensions {
  width: number;
  height: number;
}

export function makePlotThumbnailUrl(
  plotRef: FacetedPlotRef | PlotRef,
  thumbnailDimensions: ThumbnailDimensions
) {
  if (!isFacetedPlotRef(plotRef)) {
    return plotRef.toImage({
      format: 'svg',
      ...thumbnailDimensions,
    });
  } else {
    return makeFacetedPlotThumbnailUrl(plotRef, thumbnailDimensions);
  }
}

async function makeFacetedPlotThumbnailUrl(
  facetedPlotRef: FacetedPlotRef,
  thumbnailDimensions: ThumbnailDimensions
) {
  const plotImageUrls = await Promise.all(
    facetedPlotRef
      .slice(0, 4)
      .map((plotRef) =>
        plotRef == null
          ? null
          : plotRef.toImage({ format: 'svg', ...thumbnailDimensions })
      )
  );

  const plotImageWidth = thumbnailDimensions.width / 2;
  const plotImageHeight = thumbnailDimensions.height / 2;

  const plotImagePositions = [
    {
      x: 0,
      y: 0,
    },
    {
      x: plotImageWidth,
      y: 0,
    },
    {
      x: 0,
      y: plotImageHeight,
    },
    {
      x: plotImageWidth,
      y: plotImageHeight,
    },
  ];

  const plotImageNodes = zipWith(
    plotImageUrls,
    plotImagePositions,
    range(4),
    (plotImageUrl, plotImagePosition, plotIndex) =>
      plotImageUrl == null ? null : (
        <image
          key={`facet-plot-${plotIndex}`}
          href={plotImageUrl}
          width={plotImageWidth}
          height={plotImageHeight}
          {...plotImagePosition}
        />
      )
  );

  const thumbnailNode = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={thumbnailDimensions.width}
      height={thumbnailDimensions.height}
      viewBox={`0 0 ${thumbnailDimensions.width} ${thumbnailDimensions.height}`}
    >
      {plotImageNodes}
      <text
        style={{
          fontFamily: 'sans-serif',
        }}
        x={thumbnailDimensions.width * 0.5}
        y={thumbnailDimensions.height * 0.55}
        fontSize={thumbnailDimensions.height * 0.15}
        textAnchor="middle"
      >
        {facetedPlotRef.length}
      </text>
    </svg>
  );

  const thumbnailMarkup = renderToStaticMarkup(thumbnailNode);

  return `data:image/svg+xml,${encodeURIComponent(thumbnailMarkup)}`;
}
