import {
  IsEnabledInPickerParams,
  VisualizationProps,
  VisualizationType,
} from '../VisualizationTypes';
import map from './selectorIcons/map.svg';
import * as t from 'io-ts';
import { isEqual, zip, some } from 'lodash';

// map component related imports
import MapVEuMap, {
  MapVEuMapProps,
  baseLayers,
} from '@veupathdb/components/lib/map/MapVEuMap';
import { defaultAnimationDuration } from '@veupathdb/components/lib/map/config/map.json';
import geohashAnimation from '@veupathdb/components/lib/map/animation_functions/geohash';
import {
  BoundsViewport,
  Bounds,
  LatLng,
} from '@veupathdb/components/lib/map/Types';
import DonutMarker from '@veupathdb/components/lib/map/DonutMarker';

import { ColorPaletteDefault } from '@veupathdb/components/lib/types/plots/addOns';

// general ui imports
import { FormControl, Select, MenuItem, InputLabel } from '@material-ui/core';

// viz-related imports
import { PlotLayout } from '../../layouts/PlotLayout';
import { useDataClient, useStudyMetadata } from '../../../hooks/workspace';
import { useMemo, useCallback, useState } from 'react';
import { preorder } from '@veupathdb/wdk-client/lib/Utils/TreeUtils';
import DataClient, {
  MapMarkersRequestParams,
  PieplotRequestParams,
} from '../../../api/DataClient';
import { useVizConfig } from '../../../hooks/visualizations';
import { usePromise } from '../../../hooks/promise';
import {
  filtersFromBoundingBox,
  fixLabelsForNumberVariables,
} from '../../../utils/visualization';
import { useUpdateThumbnailEffect } from '../../../hooks/thumbnails';
import { OutputEntityTitle } from '../OutputEntityTitle';
import { sumBy, values } from 'lodash';
import PluginError from '../PluginError';
import { VariableDescriptor } from '../../../types/variable';
import { InputVariables } from '../InputVariables';
import { VariablesByInputName } from '../../../utils/data-element-constraints';
import { useFindEntityAndVariable } from '../../../hooks/study';
import PlotLegend, {
  LegendItemsProps,
} from '@veupathdb/components/lib/components/plotControls/PlotLegend';
import { useCheckedLegendItemsStatus } from '../../../hooks/checkedLegendItemsStatus';
import { variableDisplayWithUnit } from '../../../utils/variable-display';
import { BirdsEyeView } from '../../BirdsEyeView';

export const mapVisualization: VisualizationType = {
  selectorComponent: SelectorComponent,
  fullscreenComponent: MapViz,
  createDefaultConfig: createDefaultConfig,
  isEnabledInPicker: isEnabledInPicker,
};

function SelectorComponent() {
  return (
    <img
      alt="Geographic map"
      style={{ height: '100%', width: '100%' }}
      src={map}
    />
  );
}

function createDefaultConfig(): MapConfig {
  return {
    mapCenterAndZoom: {
      latitude: 0,
      longitude: 0,
      zoomLevel: 2,
    },
    baseLayer: 'Street',
  };
}

function isEnabledInPicker({ geoConfigs }: IsEnabledInPickerParams): boolean {
  return geoConfigs != null && geoConfigs.length > 0;
}

const defaultAnimation = {
  method: 'geohash',
  animationFunction: geohashAnimation,
  duration: defaultAnimationDuration,
};

type MapConfig = t.TypeOf<typeof MapConfig>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
const MapConfig = t.intersection([
  t.type({
    mapCenterAndZoom: t.type({
      latitude: t.number,
      longitude: t.number,
      zoomLevel: t.number,
    }),
    baseLayer: t.keyof(baseLayers),
  }),
  t.partial({
    geoEntityId: t.string,
    outputEntityId: t.string,
    xAxisVariable: VariableDescriptor,
    checkedLegendItems: t.array(t.string),
  }),
]);

type BasicMarkerData = {
  completeCasesGeoVar: number;
  markerData: {
    geoAggregateValue: string;
    entityCount: number;
    position: LatLng;
    bounds: Bounds;
    isAtomic: boolean;
  }[];
};

type PieplotData = Record<string, { label: string; value: number }[]>;

function MapViz(props: VisualizationProps) {
  const {
    computation,
    visualization,
    updateConfiguration,
    updateThumbnail,
    filters,
    totalCounts,
    filteredCounts,
    geoConfigs,
    otherVizOverviews,
    starredVariables,
    toggleStarredVariable,
  } = props;
  const studyMetadata = useStudyMetadata();
  const { id: studyId } = studyMetadata;
  const entities = useMemo(
    () =>
      Array.from(preorder(studyMetadata.rootEntity, (e) => e.children || [])),
    [studyMetadata]
  );
  const dataClient: DataClient = useDataClient();

  const [vizConfig, updateVizConfig] = useVizConfig(
    visualization.descriptor.configuration,
    MapConfig,
    createDefaultConfig,
    updateConfiguration
  );

  if (geoConfigs.length == 1 && vizConfig.geoEntityId === undefined)
    updateVizConfig({ geoEntityId: geoConfigs[0].entity.id });

  const handleViewportChanged: MapVEuMapProps['onViewportChanged'] = useCallback(
    ({ center, zoom }) => {
      if (center != null && center.length === 2 && zoom != null) {
        updateVizConfig({
          mapCenterAndZoom: {
            latitude: center[0],
            longitude: center[1],
            zoomLevel: zoom,
          },
        });
      }
    },
    [updateVizConfig]
  );

  const [boundsZoomLevel, setBoundsZoomLevel] = useState<BoundsViewport>();

  const geoConfig = useMemo(() => {
    if (vizConfig.geoEntityId == null) return undefined;
    return geoConfigs.find(
      (config) => config.entity.id === vizConfig.geoEntityId
    );
  }, [vizConfig.geoEntityId, geoConfigs]);

  const findEntityAndVariable = useFindEntityAndVariable(entities);
  const [geoEntity, outputEntity, xAxisVariable] = useMemo(() => {
    const geoEntity =
      vizConfig.geoEntityId !== null
        ? entities.find((entity) => entity.id === vizConfig.geoEntityId)
        : undefined;

    const outputEntityId =
      vizConfig.xAxisVariable?.entityId ??
      vizConfig.outputEntityId ??
      vizConfig.geoEntityId;
    const outputEntity =
      outputEntityId !== null
        ? entities.find((entity) => entity.id === outputEntityId)
        : undefined;

    const { variable: xAxisVariable } =
      findEntityAndVariable(vizConfig.xAxisVariable) ?? {};

    return [geoEntity, outputEntity ?? geoEntity, xAxisVariable];
  }, [
    entities,
    vizConfig.outputEntityId,
    vizConfig.geoEntityId,
    vizConfig.xAxisVariable,
  ]);

  // prepare some info that the map-markers and pieplot requests both need
  const {
    latitudeVariable,
    longitudeVariable,
    geoAggregateVariable,
    filtersPlusBoundsFilter,
  } = useMemo(() => {
    if (
      boundsZoomLevel == null ||
      geoConfig == null ||
      vizConfig.geoEntityId == null
    )
      return {};

    const latitudeVariable = {
      entityId: vizConfig.geoEntityId,
      variableId: geoConfig.latitudeVariableId,
    };
    const longitudeVariable = {
      entityId: vizConfig.geoEntityId,
      variableId: geoConfig.longitudeVariableId,
    };
    const geoAggregateVariable = {
      entityId: vizConfig.geoEntityId,
      variableId:
        geoConfig.aggregationVariableIds[
          geoConfig.zoomLevelToAggregationLevel(boundsZoomLevel.zoomLevel) - 1
        ],
    };

    const boundsFilters = filtersFromBoundingBox(
      boundsZoomLevel.bounds,
      latitudeVariable,
      longitudeVariable
    );

    return {
      latitudeVariable,
      longitudeVariable,
      geoAggregateVariable,
      filtersPlusBoundsFilter: filters
        ? [...filters, ...boundsFilters]
        : boundsFilters,
    };
  }, [filters, boundsZoomLevel, vizConfig.geoEntityId, geoConfig]);

  const basicMarkerData = usePromise<BasicMarkerData | undefined>(
    useCallback(async () => {
      // check all required vizConfigs are provided
      if (
        boundsZoomLevel == null ||
        vizConfig.geoEntityId == null ||
        geoConfig == null ||
        latitudeVariable == null ||
        longitudeVariable == null ||
        geoAggregateVariable == null ||
        outputEntity == null ||
        vizConfig.xAxisVariable == null
      )
        return undefined;

      const {
        northEast: { lat: xMax, lng: right },
        southWest: { lat: xMin, lng: left },
      } = boundsZoomLevel.bounds;

      // now prepare the rest of the request params
      const requestParams: MapMarkersRequestParams = {
        studyId,
        filters: filters || [],
        config: {
          outputEntityId: outputEntity.id, // might be quicker to use geoEntity.id but numbers in white markers will be wrong, momentarily
          geoAggregateVariable,
          latitudeVariable,
          longitudeVariable,
          viewport: {
            latitude: {
              xMin,
              xMax,
            },
            longitude: {
              left,
              right,
            },
          },
        },
      };

      // now get the data
      const response = await dataClient.getMapMarkers(
        computation.descriptor.type,
        requestParams
      );

      return {
        markerData: response.mapElements.map(
          ({
            avgLat,
            avgLon,
            minLat,
            minLon,
            maxLat,
            maxLon,
            entityCount,
            geoAggregateValue,
          }) => {
            const isAtomic = false; // TO DO: work with Danielle to get this info from back end
            return {
              geoAggregateValue,
              entityCount: entityCount,
              position: { lat: avgLat, lng: avgLon },
              bounds: {
                southWest: { lat: minLat, lng: minLon },
                northEast: { lat: maxLat, lng: maxLon },
              },
              isAtomic,
            };
          }
        ),
        completeCasesGeoVar: response.config.completeCasesGeoVar,
      };
    }, [
      studyId,
      filters,
      dataClient,
      // we don't want to allow vizConfig.mapCenterAndZoom to trigger an update,
      // because boundsZoomLevel does the same thing, but they can trigger two separate updates
      // (baseLayer doesn't matter either) - so we cherry pick properties of vizConfig
      vizConfig.geoEntityId,
      vizConfig.outputEntityId,
      vizConfig.xAxisVariable,
      boundsZoomLevel,
      computation.descriptor.type,
      geoConfig,
    ])
  );

  /**
   * Now we deal with the optional second request to pieplot
   */

  const pieplotData = usePromise<PieplotData | undefined>(
    useCallback(async () => {
      // check all required vizConfigs are provided
      if (
        boundsZoomLevel == null ||
        vizConfig.xAxisVariable == null ||
        filtersPlusBoundsFilter == null ||
        geoAggregateVariable == null ||
        outputEntity == null
      )
        return undefined;

      // prepare request
      const requestParams: PieplotRequestParams = {
        studyId,
        filters: filtersPlusBoundsFilter,
        config: {
          outputEntityId: outputEntity.id,
          xAxisVariable: vizConfig.xAxisVariable,
          facetVariable: [geoAggregateVariable],
          showMissingness: 'noVariables', // current back end 'showMissing' behaviour applies to facet variable
          valueSpec: 'count',
        },
      };

      // send request
      const response = await dataClient.getPieplot(
        computation.descriptor.type,
        requestParams
      );

      // process response and return a map of "geoAgg key" => donut labels and counts
      return response.pieplot.data.reduce(
        // KNOWN TYPO IN BACK END (should be pieplot)
        (map, { facetVariableDetails, label, value }) => {
          if (facetVariableDetails != null && facetVariableDetails.length === 1)
            map[facetVariableDetails[0].value] = zip(label, value).map(
              ([label, value]) => ({
                label: label!,
                value: value!,
              })
            );
          return map;
        },
        {} as PieplotData
      );
    }, [
      studyId,
      filtersPlusBoundsFilter,
      dataClient,
      vizConfig.xAxisVariable,
      boundsZoomLevel,
      computation.descriptor.type,
    ])
  );

  /**
   * Merge the pieplot data into the basicMarkerData, if available,
   * and create markers.
   */
  const markers = useMemo(() => {
    const vocabulary = fixLabelsForNumberVariables(
      xAxisVariable?.vocabulary,
      xAxisVariable
    );
    return basicMarkerData.value?.markerData.map(
      ({ geoAggregateValue, entityCount, bounds, position }) => {
        const donutData =
          pieplotData.value != null &&
          pieplotData.value[geoAggregateValue] != null
            ? pieplotData.value[geoAggregateValue]
                .map(({ label, value }) => ({
                  label,
                  value,
                  color: ColorPaletteDefault[vocabulary.indexOf(label!)],
                }))
                // DonutMarkers don't handle checkedLegendItems automatically, like our
                // regular PlotlyPlot components, so we do the filtering here
                .filter(
                  ({ label }) =>
                    vizConfig.checkedLegendItems == null ||
                    vizConfig.checkedLegendItems.indexOf(label) > -1
                )
            : [];

        // provide the 'plain white' donut data if all legend items unchecked
        // or if there is no pieplot data
        const safeDonutData =
          donutData.length > 0
            ? donutData
            : [
                {
                  label: 'unknown',
                  value: entityCount,
                  color: 'white',
                },
              ];

        // TO DO: find out if MarkerProps.id is obsolete
        return (
          <DonutMarker
            id={geoAggregateValue}
            key={geoAggregateValue}
            bounds={bounds}
            position={position}
            data={safeDonutData}
            duration={defaultAnimationDuration}
          />
        );
      }
    );
  }, [basicMarkerData.value, pieplotData.value, vizConfig.checkedLegendItems]);

  const totalEntityCount = basicMarkerData.value?.completeCasesGeoVar;

  /**
   * Now render the visualization
   */
  const [height, width] = [600, 1000];
  const { latitude, longitude, zoomLevel } = vizConfig.mapCenterAndZoom;

  // Create the ref that we send to the map in web-components
  const plotRef = useUpdateThumbnailEffect(
    updateThumbnail,
    { height, width },
    // The dependencies for needing to generate a new thumbnail
    [
      markers,
      latitude,
      longitude,
      zoomLevel,
      vizConfig.baseLayer,
      vizConfig.checkedLegendItems,
    ]
  );

  const plotNode = (
    <MapVEuMap
      viewport={{ center: [latitude, longitude], zoom: zoomLevel }}
      onViewportChanged={handleViewportChanged}
      onBoundsChanged={setBoundsZoomLevel}
      markers={markers ?? []}
      animation={defaultAnimation}
      height={height}
      width={width}
      showGrid={geoConfig?.zoomLevelToAggregationLevel != null}
      zoomLevelToGeohashLevel={geoConfig?.zoomLevelToAggregationLevel}
      ref={plotRef}
      baseLayer={vizConfig.baseLayer}
      onBaseLayerChanged={(newBaseLayer) =>
        updateVizConfig({ baseLayer: newBaseLayer })
      }
      flyToMarkers={
        markers &&
        markers.length > 0 &&
        isEqual(
          vizConfig.mapCenterAndZoom,
          createDefaultConfig().mapCenterAndZoom
        )
      }
      flyToMarkersDelay={500}
      showSpinner={basicMarkerData.pending || pieplotData.pending}
      // whether to show scale at map
      showScale={zoomLevel != null && zoomLevel > 4 ? true : false}
      // show mouse tool
      showMouseToolbar={true}
    />
  );

  const handleGeoEntityChange = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      if (event != null)
        updateVizConfig({
          geoEntityId: event.target.value as string,
          mapCenterAndZoom: createDefaultConfig().mapCenterAndZoom,
        });
    },
    [updateVizConfig]
  );

  const handleOutputEntityChange = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      if (event != null)
        updateVizConfig({ outputEntityId: event.target.value as string });
    },
    [updateVizConfig]
  );

  const handleInputVariableChange = useCallback(
    ({ xAxisVariable }: VariablesByInputName) => {
      updateVizConfig({ xAxisVariable, checkedLegendItems: undefined });
    },
    [updateVizConfig]
  );

  const handleCheckedLegendItemsChange = useCallback(
    (newCheckedItems) => {
      if (newCheckedItems != null)
        updateVizConfig({ checkedLegendItems: newCheckedItems });
    },
    [updateVizConfig]
  );

  const availableOutputEntities = useMemo(() => {
    if (geoConfig == null) {
      return entities;
    } else {
      return Array.from(
        preorder(geoConfig.entity, (entity) => entity.children || [])
      );
    }
  }, [entities, geoConfig]);

  /**
   * create custom legend data
   */

  const legendItems: LegendItemsProps[] = useMemo(() => {
    const vocabulary = xAxisVariable?.vocabulary;
    if (vocabulary == null) return [];

    return vocabulary.map((label) => ({
      label,
      marker: 'square',
      markerColor: ColorPaletteDefault[vocabulary.indexOf(label)],
      // has any geo-facet got an array of pieplot data
      // containing at least one element that satisfies label==label and value>0?
      hasData: some(pieplotData.value, (pieData) =>
        some(pieData, (data) => data.label === label && data.value > 0)
      ),
      group: 1,
      rank: 1,
    }));
  }, [xAxisVariable, pieplotData.value]);

  // set checkedLegendItems
  const checkedLegendItems = useCheckedLegendItemsStatus(
    legendItems,
    vizConfig.checkedLegendItems
  );

  const legendNode = legendItems != null && (
    <PlotLegend
      legendItems={legendItems}
      checkedLegendItems={checkedLegendItems}
      legendTitle={variableDisplayWithUnit(xAxisVariable)}
      onCheckedLegendItemsChange={handleCheckedLegendItemsChange}
    />
  );

  // get variable constraints for InputVariables
  const pieOverview = otherVizOverviews.find(
    (overview) => overview.name === 'pieplot'
  );
  if (pieOverview == null)
    throw new Error('Map visualization cannot find pieplot helper');
  const pieConstraints = pieOverview.dataElementConstraints;
  const pieDependencyOrder = pieOverview.dataElementDependencyOrder;

  const tableGroupNode = (
    // Bird's eye plot isn't yet functional
    <BirdsEyeView
      completeCasesAxesVars={totalEntityCount}
      completeCasesAllVars={0 /* can't be undefined for some reason */}
      outputEntity={outputEntity}
      stratificationIsActive={
        false /* this disables the 'strata and axes' bar/impulse */
      }
      // enableSpinner={vizConfig.xAxisVariable != null && !pieplotData.error}
      totalCounts={totalCounts.value}
      filteredCounts={filteredCounts.value}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          width,
          display: 'flex',
          alignItems: 'center',
          zIndex: 1,
          justifyContent: 'space-between',
        }}
      >
        {geoConfigs.length > 1 && (
          <FormControl style={{ minWidth: '200px' }} variant="filled">
            <InputLabel>Map the locations of</InputLabel>
            <Select
              value={vizConfig.geoEntityId ?? ''}
              onChange={handleGeoEntityChange}
            >
              {geoConfigs.map((geoConfig) => (
                <MenuItem key={geoConfig.entity.id} value={geoConfig.entity.id}>
                  {geoConfig.entity.displayNamePlural ??
                    geoConfig.entity.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {/* <FormControl style={{ minWidth: '200px' }} variant="filled">
          <InputLabel>Show counts of</InputLabel>
          <Select
            value={outputEntity?.id ?? ''}
            onChange={handleOutputEntityChange}
            disabled={vizConfig.xAxisVariable != null}
          >
            {availableOutputEntities.map((entity) => (
              <MenuItem key={entity.id} value={entity.id}>
                {entity.displayNamePlural ?? entity.displayName}
              </MenuItem>
            ))}
          </Select>
        </FormControl> */}
        <InputVariables
          inputs={[
            {
              name: 'xAxisVariable',
              label: 'Main',
            },
          ]}
          entities={entities}
          selectedVariables={{
            xAxisVariable: vizConfig.xAxisVariable,
          }}
          onChange={handleInputVariableChange}
          constraints={pieConstraints}
          dataElementDependencyOrder={pieDependencyOrder}
          starredVariables={starredVariables}
          toggleStarredVariable={toggleStarredVariable}
          outputEntity={outputEntity}
        />
      </div>

      {studyId.startsWith('UMSP') && ( // <<<<<<<<< TEMPORARY ONLY <<<<<
        <div>
          <p>
            (UMSP is BIG! If you want to show counts or a categorical overlay
            for anything other than the Household entity, it's best to first
            subset aggressively and zoom in to a few hundred households.)
          </p>
        </div>
      )}

      <PluginError
        error={basicMarkerData.error}
        outputSize={totalEntityCount}
      />
      <OutputEntityTitle entity={outputEntity} outputSize={totalEntityCount} />
      <PlotLayout
        isFaceted={false}
        legendNode={legendNode}
        plotNode={plotNode}
        tableGroupNode={tableGroupNode}
      />
    </div>
  );
}
