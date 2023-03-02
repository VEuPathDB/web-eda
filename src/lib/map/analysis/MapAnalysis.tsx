import { useCallback, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import * as t from 'io-ts';
import { safeHtml } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';

import {
  PromiseResult,
  useAnalysis,
  useDataClient,
  useFindEntityAndVariable,
  usePromise,
  useStudyEntities,
  useStudyMetadata,
  useStudyRecord,
} from '../../core';
import MapVEuMap from '@veupathdb/components/lib/map/MapVEuMap';
import { useGeoConfig } from '../../core/hooks/geoConfig';
import { useMapMarkers } from '../../core/hooks/mapMarkers';
import { InputVariables } from '../../core/components/visualizations/InputVariables';
import { useToggleStarredVariable } from '../../core/hooks/starredVariables';
import { DocumentationContainer } from '../../core/components/docs/DocumentationContainer';
import {
  FullScreenVisualization,
  NewVisualizationPickerModal,
} from '../../core/components/visualizations/VisualizationsContainer';
import {
  Close,
  Download,
  FilledButton,
  Filter,
  FloatingButton,
  Pencil,
  SampleDetailsLight,
  Share,
} from '@veupathdb/coreui';
import { Visualization } from '../../core/types/visualization';
import { useEntityCounts } from '../../core/hooks/entityCounts';
import { Tooltip } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { ComputationPlugin } from '../../core/components/computations/Types';
import { ZeroConfigWithButton } from '../../core/components/computations/ZeroConfiguration';
import { histogramVisualization } from '../../core/components/visualizations/implementations/HistogramVisualization';
import { VisualizationPlugin } from '../../core/components/visualizations/VisualizationPlugin';
import { LayoutOptions } from '../../core/components/layouts/types';
import { OverlayOptions } from '../../core/components/visualizations/options/types';
import { FloatingLayout } from '../../core/components/layouts/FloatingLayout';
import {
  contTableVisualization,
  twoByTwoVisualization,
} from '../../core/components/visualizations/implementations/MosaicVisualization';
import { scatterplotVisualization } from '../../core/components/visualizations/implementations/ScatterplotVisualization';
import { lineplotVisualization } from '../../core/components/visualizations/implementations/LineplotVisualization';
import { barplotVisualization } from '../../core/components/visualizations/implementations/BarplotVisualization';
import { boxplotVisualization } from '../../core/components/visualizations/implementations/BoxplotVisualization';
import ShowHideVariableContextProvider from '../../core/utils/show-hide-variable-context';
import { MapLegend } from './MapLegend';
import { AppState, useAppState } from './appState';
import { FloatingDiv } from './FloatingDiv';
import Subsetting from '../../workspace/Subsetting';
import { findFirstVariable } from '../../workspace/Utils';
import {
  useFeaturedFields,
  useFieldTree,
  useFlattenedFields,
} from '../../core/components/variableTrees/hooks';
import { MapNavigationLogoProps, SemiTransparentHeader } from './MapNavigation';
import FilterChipList from '../../core/components/FilterChipList';
import { VariableLinkConfig } from '../../core/components/VariableLink';
import { MapSideNavigation } from './MapSideNavigation';

const mapStyle: React.CSSProperties = {
  zIndex: 1,
};

function vizPluginWithOptions(
  vizPlugin: VisualizationPlugin<LayoutOptions & OverlayOptions>
) {
  return vizPlugin.withOptions({
    hideFacetInputs: true,
    layoutComponent: FloatingLayout,
  });
}

const plugin: ComputationPlugin = {
  configurationComponent: ZeroConfigWithButton,
  isConfigurationValid: t.undefined.is,
  createDefaultConfiguration: () => undefined,
  visualizationPlugins: {
    histogram: vizPluginWithOptions(histogramVisualization),
    twobytwo: vizPluginWithOptions(twoByTwoVisualization),
    conttable: vizPluginWithOptions(contTableVisualization),
    scatterplot: vizPluginWithOptions(scatterplotVisualization),
    lineplot: vizPluginWithOptions(lineplotVisualization),
    barplot: vizPluginWithOptions(barplotVisualization),
    boxplot: vizPluginWithOptions(boxplotVisualization),
  },
};

interface Props {
  analysisId: string;
  studyId: string;
  logoProps: MapNavigationLogoProps;
}

export function MapAnalysis(props: Props) {
  const appStateAndSetters = useAppState(
    '@@mapApp@@',
    useAnalysis(props.analysisId, 'pass-through')
  );
  if (appStateAndSetters.appState == null) return null;
  return (
    <MapAnalysisImpl {...props} {...(appStateAndSetters as CompleteAppState)} />
  );
}

type CompleteAppState = ReturnType<typeof useAppState> & {
  appState: AppState;
};

export function MapAnalysisImpl(props: Props & CompleteAppState) {
  const {
    analysisId,
    appState,
    setMouseMode,
    setSelectedOverlayVariable,
    setViewport,
    setActiveVisualizationId,
    setBoundsZoomLevel,
    setSubsetVariableAndEntity,
    setIsSubsetPanelOpen,
  } = props;
  const studyRecord = useStudyRecord();
  const studyMetadata = useStudyMetadata();
  const studyEntities = useStudyEntities();
  const geoConfigs = useGeoConfig(studyEntities);
  const analysisState = useAnalysis(analysisId, 'pass-through');
  const geoConfig = geoConfigs[0];

  const [isVizSelectorVisible, setIsVizSelectorVisible] = useState(false);

  const selectedVariables = useMemo(
    () => ({
      overlay: appState.selectedOverlayVariable,
    }),
    [appState.selectedOverlayVariable]
  );

  const findEntityAndVariable = useFindEntityAndVariable();
  const { entity, variable } =
    findEntityAndVariable(selectedVariables.overlay) ?? {};

  const toggleStarredVariable = useToggleStarredVariable(analysisState);

  const {
    markers,
    pending,
    legendItems,
    basicMarkerError,
    overlayError,
    totalEntityCount: totalEntityInSubsetCount,
    totalVisibleEntityCount,
  } = useMapMarkers({
    requireOverlay: false,
    boundsZoomLevel: appState.boundsZoomLevel,
    geoConfig: geoConfig,
    studyId: studyMetadata.id,
    filters: analysisState.analysis?.descriptor.subset.descriptor,
    xAxisVariable: selectedVariables.overlay,
    computationType: 'pass',
    markerType: 'pie',
    checkedLegendItems: undefined,
    //TO DO: maybe dependentAxisLogScale
  });

  const finalMarkers = useMemo(() => markers || [], [markers]);

  const dataClient = useDataClient();

  const appPromiseState = usePromise(
    useCallback(async () => {
      const { apps } = await dataClient.getApps();
      const app = apps.find((a) => a.name === 'pass');
      if (app == null) throw new Error('Could not find pass app.');
      return app;
    }, [dataClient])
  );

  const computation = analysisState.analysis?.descriptor.computations[0];

  const updateVisualizations = useCallback(
    (
      visualizations:
        | Visualization[]
        | ((visualizations: Visualization[]) => Visualization[])
    ) => {
      analysisState.setComputations((computations) =>
        computations.map((c) =>
          c.computationId !== computation?.computationId
            ? c
            : {
                ...c,
                visualizations:
                  typeof visualizations === 'function'
                    ? visualizations(c.visualizations)
                    : visualizations,
              }
        )
      );
    },
    [analysisState, computation?.computationId]
  );

  const onVisualizationCreated = useCallback(
    (visualizationId: string) => {
      setIsVizSelectorVisible(false);
      setActiveVisualizationId(visualizationId);
    },
    [setActiveVisualizationId, setIsVizSelectorVisible]
  );

  const activeViz = analysisState.analysis?.descriptor.computations
    .flatMap((c) => c.visualizations)
    .find((v) => v.visualizationId === appState.activeVisualizationId);

  const totalCounts = useEntityCounts();
  const filteredCounts = useEntityCounts(
    analysisState.analysis?.descriptor.subset.descriptor
  );

  const fieldTree = useFieldTree(
    useFlattenedFields(studyEntities, 'variableTree')
  );
  const featuredFields = useFeaturedFields(studyEntities, 'variableTree');

  const subsetVariableAndEntity = useMemo(() => {
    if (appState.subsetVariableAndEntity)
      return appState.subsetVariableAndEntity;
    if (featuredFields.length) {
      const [entityId, variableId] = featuredFields[0].term.split('/');
      return { entityId, variableId };
    } else {
      const variable = findFirstVariable(
        fieldTree,
        studyMetadata.rootEntity.id
      );
      const [entityId, variableId] = variable?.field.term.split('/') ?? [];
      return { entityId, variableId };
    }
  }, [
    appState.subsetVariableAndEntity,
    featuredFields,
    fieldTree,
    studyMetadata.rootEntity.id,
  ]);

  const totalEntitiesInSampleCount = (() => {
    if (!totalCounts.value || !subsetVariableAndEntity.entityId) return 0;

    return totalCounts.value[subsetVariableAndEntity.entityId];
  })();

  const fullScreenActions = (
    <>
      <div>
        <Tooltip title="Delete visualization">
          <button
            aria-label={`Delete ${activeViz?.displayName || 'visualization.'}`}
            type="button"
            className="link"
            onClick={() => {
              if (activeViz == null) return;
              updateVisualizations((visualizations) =>
                visualizations.filter(
                  (v) => v.visualizationId !== activeViz.visualizationId
                )
              );
              setActiveVisualizationId(undefined);
            }}
          >
            <i aria-hidden className="fa fa-trash"></i>
          </button>
        </Tooltip>
      </div>
      <div>
        <Tooltip title="Copy visualization">
          <button
            aria-label={`Create a copy of ${
              activeViz?.displayName || 'visualization.'
            }`}
            type="button"
            className="link"
            onClick={() => {
              if (activeViz == null) return;
              const vizCopyId = uuid();
              updateVisualizations((visualizations) =>
                visualizations.concat({
                  ...activeViz,
                  visualizationId: vizCopyId,
                  displayName:
                    'Copy of ' +
                    (activeViz.displayName || 'unnamed visualization'),
                })
              );
              setActiveVisualizationId(vizCopyId);
            }}
          >
            <i aria-hidden className="fa fa-clone"></i>
          </button>
        </Tooltip>
      </div>
      <Tooltip title="Minimize visualization">
        <Link
          to=""
          onClick={(e) => {
            e.preventDefault();
            setActiveVisualizationId(undefined);
          }}
        >
          <i aria-hidden className="fa fa-window-minimize" />
        </Link>
      </Tooltip>
    </>
  );

  const [mapHeaderIsExpanded, setMapHeaderIsExpanded] = useState<boolean>(true);

  const FilterChipListForHeader = () => {
    const filterChipConfig: VariableLinkConfig = {
      type: 'button',
      onClick(value) {
        setIsSubsetPanelOpen && setIsSubsetPanelOpen(true);
        setSubsetVariableAndEntity(value);
      },
    };

    const filters = analysisState.analysis?.descriptor.subset.descriptor;

    function makeButtonText() {
      if (!filters) return '';

      const { isSubsetPanelOpen } = appState;
      const showOrHide = isSubsetPanelOpen ? 'Hide' : 'Show';
      const suffix = filters.length === 1 ? '' : 's';
      return `${showOrHide} ${filters.length} filter${suffix}`;
    }

    if (!studyEntities || !filters) return <></>;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 30,
        }}
        className="FilterChips"
      >
        {filters.length > 0 ? (
          <FilledButton
            onPress={() => {
              setIsSubsetPanelOpen &&
                setIsSubsetPanelOpen(!appState.isSubsetPanelOpen);
            }}
            text={makeButtonText()}
            icon={Filter}
            size="small"
            styleOverrides={{
              container: {
                marginBottom: 5,
                marginRight: 16,
              },
            }}
          />
        ) : (
          <p style={{ padding: 0, margin: '0 0 0 5px', fontSize: 16 }}>
            No filters applied.
          </p>
        )}
        <div>
          <FilterChipList
            filters={filters}
            removeFilter={(filter) =>
              analysisState.analysis &&
              analysisState.setFilters(
                analysisState.analysis.descriptor.subset.descriptor.filter(
                  (f) => f !== filter
                )
              )
            }
            variableLinkConfig={filterChipConfig}
            entities={studyEntities}
            selectedEntityId={subsetVariableAndEntity.entityId}
            selectedVariableId={subsetVariableAndEntity.variableId}
          />
        </div>
      </div>
    );
  };

  const buttonStyles: React.CSSProperties = {
    background: 'transparent',
    borderColor: 'transparent',
    fontSize: 16,
    margin: 0,
    padding: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
  };
  const iconStyles: React.CSSProperties = {
    height: 25,
    width: 25,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };
  const labelStyles: React.CSSProperties = {
    marginLeft: '0.5rem',
  };
  const [activeSideMenuItem, setActiveSideMenuItem] = useState<
    number | undefined
  >();

  const sideNavigationItems = [
    <button
      style={buttonStyles}
      onClick={() =>
        setActiveSideMenuItem((current) => (current === 0 ? undefined : 0))
      }
    >
      <span style={iconStyles} aria-hidden>
        <Share />
      </span>
      <span style={labelStyles}>Paint by variable</span>
    </button>,
    <button
      style={buttonStyles}
      onClick={() =>
        setActiveSideMenuItem((current) => (current === 1 ? undefined : 1))
      }
    >
      <span style={iconStyles} aria-hidden>
        <Filter />
      </span>
      <span style={labelStyles}>Filter data</span>
    </button>,
    <button
      style={buttonStyles}
      onClick={() =>
        setActiveSideMenuItem((current) => (current === 2 ? undefined : 2))
      }
    >
      <span style={iconStyles} aria-hidden>
        <Download />
      </span>
      <span style={labelStyles}>Download map</span>
    </button>,
    <button
      style={buttonStyles}
      onClick={() =>
        setActiveSideMenuItem((current) => (current === 3 ? undefined : 3))
      }
    >
      <span style={iconStyles} aria-hidden>
        <Pencil />
      </span>
      <span style={labelStyles}>Edit configuration</span>
    </button>,
    <button
      style={buttonStyles}
      onClick={() =>
        setActiveSideMenuItem((current) => (current === 4 ? undefined : 4))
      }
    >
      <span style={iconStyles} aria-hidden>
        <SampleDetailsLight />
      </span>
      <span style={labelStyles}>Study Information</span>
    </button>,
  ];

  return (
    <PromiseResult state={appPromiseState}>
      {(app) => (
        <ShowHideVariableContextProvider>
          <DocumentationContainer>
            <div
              style={{
                height: '100%',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: '100%',
                  background: 'transparent',
                  position: 'absolute',
                  zIndex: 2,
                  pointerEvents: 'none',
                  top: 0,
                  left: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <SemiTransparentHeader
                  analysisName={analysisState.analysis?.displayName}
                  filterList={<FilterChipListForHeader />}
                  isExpanded={mapHeaderIsExpanded}
                  logoProps={props.logoProps}
                  onAnalysisNameEdit={analysisState.setName}
                  onToggleExpand={() => setMapHeaderIsExpanded((c) => !c)}
                  studyName={studyRecord.displayName}
                  totalEntitesInSampleCount={totalEntitiesInSampleCount}
                  totalEntitiesInSubsetCount={totalEntityInSubsetCount}
                  visibleEntitiesCount={totalVisibleEntityCount}
                />
                <MapSideNavigation logoProps={props.logoProps}>
                  <div style={{ width: '100%' }}>
                    <ul style={{ margin: 0, padding: 0 }}>
                      {[
                        ...sideNavigationItems,
                        ...sideNavigationItems,
                        ...sideNavigationItems,
                        ...sideNavigationItems,
                      ].map((item, itemIndex) => {
                        const isActive = itemIndex === activeSideMenuItem;
                        return (
                          <li
                            key={itemIndex}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              padding: '0.25rem',
                              width: '100%',
                              transition: 'background 0.2s ease',
                              borderRight: `5px solid ${
                                isActive ? 'black' : 'transparent'
                              }`,
                              background: isActive
                                ? 'rgba(0, 0, 0, 0.075)'
                                : 'transparent',
                            }}
                          >
                            {item}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </MapSideNavigation>
              </div>
              <MapVEuMap
                height="100%"
                width="100%"
                style={mapStyle}
                showMouseToolbar={false}
                showZoomControl={false}
                showLayerSelector={false}
                showSpinner={pending}
                animation={null}
                viewport={appState.viewport}
                markers={finalMarkers}
                mouseMode={appState.mouseMode}
                flyToMarkers={false}
                flyToMarkersDelay={500}
                onBoundsChanged={setBoundsZoomLevel}
                onViewportChanged={setViewport}
                onMouseModeChange={setMouseMode}
                showGrid={geoConfig?.zoomLevelToAggregationLevel !== null}
                zoomLevelToGeohashLevel={geoConfig?.zoomLevelToAggregationLevel}
              />
              <FloatingDiv
                style={{
                  top: 350,
                  right: 50,
                }}
              >
                {legendItems.length > 0 && (
                  <MapLegend
                    legendItems={legendItems}
                    title={variable?.displayName}
                  />
                )}
              </FloatingDiv>
              {/* <FloatingDiv
                style={{
                  top: 250,
                  left: 500,
                  left: 100,
                }}
              >
                <div>
                  {safeHtml(studyRecord.displayName)} (
                  {totalEntityInSubsetCount})
                </div>
                <div>
                  Showing {entity?.displayName} variable {variable?.displayName}
                </div>
                <div>
                  <FilledButton
                    text="Open Filters"
                    onPress={() => setIsSubsetPanelOpen(true)}
                  />
                </div>
                <div>
                  <InputVariables
                    inputs={[{ name: 'overlay', label: 'Overlay' }]}
                    entities={studyEntities}
                    selectedVariables={selectedVariables}
                    onChange={(selectedVariables) =>
                      setSelectedOverlayVariable(selectedVariables.overlay)
                    }
                    starredVariables={
                      analysisState.analysis?.descriptor.starredVariables ?? []
                    }
                    toggleStarredVariable={toggleStarredVariable}
                  />
                </div>
                <FilledButton
                  text="Add a plot"
                  onPress={() => setIsVizSelectorVisible(true)}
                />
                <ul>
                  {analysisState.analysis?.descriptor.computations.map(
                    (computation) => (
                      <li key={computation.computationId}>
                        <strong>
                          {computation.displayName} (
                          {computation.descriptor.type})
                        </strong>
                        <ul>
                          {computation.visualizations.map((viz) => (
                            <li key={viz.visualizationId}>
                              <button
                                type="button"
                                className="link"
                                onClick={() => {
                                  setActiveVisualizationId(viz.visualizationId);
                                }}
                              >
                                {viz.displayName} ({viz.descriptor.type})
                              </button>
                            </li>
                          ))}
                        </ul>
                      </li>
                    )
                  )}
                </ul>
              </FloatingDiv> */}
              <FloatingDiv
                style={{
                  bottom: 10,
                  left: 100,
                }}
              >
                {activeViz && (
                  <div
                    style={{
                      transform: 'scale(0.9)',
                      background: 'white',
                      minHeight: '10em',
                      minWidth: '12em',
                      width: '65em',
                      position: 'fixed',
                      right: 0,
                      bottom: 0,
                      zIndex: 2000,
                      padding: '0 1em',
                    }}
                  >
                    <FullScreenVisualization
                      analysisState={analysisState}
                      computation={computation!}
                      updateVisualizations={updateVisualizations}
                      visualizationPlugins={plugin.visualizationPlugins}
                      visualizationsOverview={app.visualizations}
                      geoConfigs={[geoConfig]}
                      computationAppOverview={app}
                      filters={
                        analysisState.analysis?.descriptor.subset.descriptor ??
                        []
                      }
                      starredVariables={
                        analysisState.analysis?.descriptor.starredVariables ??
                        []
                      }
                      toggleStarredVariable={toggleStarredVariable}
                      totalCounts={totalCounts}
                      filteredCounts={filteredCounts}
                      isSingleAppMode
                      disableThumbnailCreation
                      id={activeViz.visualizationId}
                      actions={fullScreenActions}
                    />
                  </div>
                )}
              </FloatingDiv>
              {(basicMarkerError || overlayError) && (
                <FloatingDiv
                  style={{ top: undefined, bottom: 50, left: 100, right: 100 }}
                >
                  {basicMarkerError && <div>{String(basicMarkerError)}</div>}
                  {overlayError && <div>{String(overlayError)}</div>}
                </FloatingDiv>
              )}
            </div>
            <FloatingDiv
              style={{
                top: 100,
                left: 100,
                right: 100,
                bottom: 10,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {appState.isSubsetPanelOpen && (
                <>
                  <FloatingButton
                    text=""
                    icon={Close}
                    onPress={() => setIsSubsetPanelOpen(false)}
                    styleOverrides={{
                      container: {
                        display: 'flex',
                        marginLeft: 'auto',
                      },
                    }}
                  />
                  <div style={{ overflow: 'auto' }}>
                    <Subsetting
                      variableLinkConfig={{
                        type: 'button',
                        onClick: setSubsetVariableAndEntity,
                      }}
                      entityId={subsetVariableAndEntity?.entityId ?? ''}
                      variableId={subsetVariableAndEntity?.variableId ?? ''}
                      analysisState={analysisState}
                      totalCounts={totalCounts.value}
                      filteredCounts={filteredCounts.value}
                    />
                  </div>
                </>
              )}
            </FloatingDiv>
            <NewVisualizationPickerModal
              visible={isVizSelectorVisible}
              onVisibleChange={setIsVizSelectorVisible}
              computation={computation!}
              updateVisualizations={updateVisualizations}
              visualizationPlugins={plugin.visualizationPlugins}
              visualizationsOverview={app.visualizations}
              geoConfigs={[geoConfig]}
              onVisualizationCreated={onVisualizationCreated}
            />
          </DocumentationContainer>
        </ShowHideVariableContextProvider>
      )}
    </PromiseResult>
  );
}
