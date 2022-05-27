import { useState, useCallback, useEffect, useMemo } from 'react';
import { ceil } from 'lodash';
import useDimensions from 'react-cool-dimensions';

// Components & Component Generators
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import { safeHtml } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import { Loading, LoadingOverlay } from '@veupathdb/wdk-client/lib/Components';
import MultiSelectVariableTree from '../../core/components/variableTrees/MultiSelectVariableTree';
import { Modal, H5, DataGrid, MesaButton, Download } from '@veupathdb/coreui';

// Definitions
import { AnalysisState } from '../../core/hooks/analysis';
import { StudyEntity, TabularDataResponse, usePromise } from '../../core';
import { VariableDescriptor } from '../../core/types/variable';
import { APIError } from '../../core/api/types';
import { useUITheme } from '@veupathdb/coreui/dist/components/theming';
import { gray } from '@veupathdb/coreui/dist/definitions/colors';

// Hooks
import {
  useStudyMetadata,
  useStudyRecord,
  useSubsettingClient,
} from '../../core';

import { useFeaturedFields } from '../../core/components/variableTrees/hooks';
import { useProcessedGridData, processGridData } from './hooks';

type SubsettingDataGridProps = {
  /** Should the modal currently be visible? */
  displayModal: boolean;
  /** Toggle the display of the modal. */
  toggleDisplay: () => void;
  /** Analysis state. We will read/write to this object. */
  analysisState: AnalysisState;
  /** The entities for the Study/Analysis being interacted with. */
  entities: Array<StudyEntity>;
  /** The ID of the currently selected entity. */
  currentEntityID: string;
  /** Record counts for the currently selected entity. With an without any applied filters. */
  currentEntityRecordCounts: {
    total: number | undefined;
    filtered: number | undefined;
  };
  starredVariables?: VariableDescriptor[];
  toggleStarredVariable: (targetVariableId: VariableDescriptor) => void;
};

const NumberedHeader = (props: {
  number: number;
  text: string;
  color?: string;
}) => {
  const color = props.color ?? 'black';
  const height = 25;

  return (
    <div>
      <div
        style={{
          display: 'inline-block',
          width: height,
          height: height,
          lineHeight: height + 'px',
          color: color,
          border: '2px solid ' + color,
          borderRadius: height,
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center',
          boxSizing: 'content-box',
          userSelect: 'none',
        }}
      >
        {props.number}
      </div>
      <div
        style={{
          display: 'inline-block',
          marginLeft: 5,
          height: height,
          lineHeight: height + 'px',
          color: color,
          fontSize: 16,
          fontWeight: 'bold',
        }}
      >
        {props.text}
      </div>
    </div>
  );
};

/**
 * Displays a modal through with the user can:
 * 1. Select entity/variable data for display in a tabular format.
 * 2. Request a CSV of the selected data for download.
 */
export default function SubsettingDataGridModal({
  displayModal,
  toggleDisplay,
  analysisState,
  entities,
  currentEntityID,
  currentEntityRecordCounts,
  starredVariables,
  toggleStarredVariable,
}: SubsettingDataGridProps) {
  const theme = useUITheme();
  const primaryColor = theme?.palette.primary.hue[theme.palette.primary.level];

  const {
    observe: observeEntityDescription,
    width: entityDescriptionWidth,
  } = useDimensions();

  //   Various Custom Hooks
  const studyRecord = useStudyRecord();
  const studyMetadata = useStudyMetadata();
  const subsettingClient = useSubsettingClient();
  const featuredFields = useFeaturedFields(entities, 'download');

  const scopedFeaturedFields = useMemo(
    () =>
      featuredFields.filter((field) =>
        field.term.startsWith(currentEntityID + '/')
      ),
    [currentEntityID, featuredFields]
  );

  const scopedStarredVariables = useMemo(
    () =>
      starredVariables?.filter(
        (variable) => variable.entityId === currentEntityID
      ) ?? [],
    [currentEntityID, starredVariables]
  );

  const [currentEntity, setCurrentEntity] = useState<StudyEntity | undefined>(
    undefined
  );

  // Used to track if there is an inflight API call.
  const [dataLoading, setDataLoading] = useState(false);

  // API error storage.
  const [apiError, setApiError] = useState<APIError | null>(null);

  // Whether or not to display the variable tree.
  const [tableIsExpanded, setTableIsExpanded] = useState(false);

  // Internal storage of currently loaded data from API.
  const [gridData, setGridData] = useState<TabularDataResponse | null>(null);
  const [gridColumns, gridRows] = useProcessedGridData(
    gridData,
    entities,
    currentEntity
  );

  // The current record pagecount.
  const [pageCount, setPageCount] = useState(0);

  // An array of variable descriptors representing the currently
  // selected variables.
  const [
    selectedVariableDescriptors,
    setSelectedVariableDescriptors,
  ] = useState<Array<VariableDescriptor>>(
    analysisState.analysis?.descriptor.dataTableConfig[currentEntityID]
      ?.variables ?? []
  );

  // Required columns
  const requiredColumns = usePromise(
    useCallback(async () => {
      const data = await subsettingClient.getTabularData(
        studyMetadata.id,
        currentEntityID,
        {
          filters: [],
          outputVariableIds: [],
          reportConfig: {
            headerFormat: 'standard',
            paging: { numRows: 1, offset: 0 },
          },
        }
      );
      return processGridData(data, entities, currentEntity)[0];
    }, [
      subsettingClient,
      studyMetadata.id,
      currentEntityID,
      entities,
      currentEntity,
    ])
  );

  const requiredColumnAccessors = requiredColumns.value?.map(
    (column) => column.accessor
  );

  /**
   * Actions to take when the modal is opened.
   */
  const onModalOpen = useCallback(() => {
    // Sync the current entity inside the modal to whatever is
    // current selected by the user outside the modal.
    setCurrentEntity(entities.find((entity) => entity.id === currentEntityID));
  }, [currentEntityID, entities]);

  /** Actions to take when modal is closed. */
  const onModalClose = useCallback(() => {
    setGridData(null);
    setTableIsExpanded(false);
  }, []);

  const mergeKeys = useMemo(() => {
    if (!currentEntity) return [];
    return currentEntity.variables
      .filter((variable) => 'isMergeKey' in variable && variable.isMergeKey)
      .map((mergeKey) => mergeKey.id);
  }, [currentEntity]);

  const selectedVariableDescriptorsWithMergeKeys = useMemo(() => {
    if (!currentEntity) return [];
    return mergeKeys
      .map((key) => {
        return { entityId: currentEntity?.id, variableId: key };
      })
      .concat(selectedVariableDescriptors);
  }, [mergeKeys, selectedVariableDescriptors, currentEntity]);

  console.log({
    mergeKeys,
    selectedVariableDescriptors,
    selectedVariableDescriptorsWithMergeKeys,
    gridColumns,
    gridData,
    requiredColumns,
  });

  const fetchPaginatedData = useCallback(
    ({ pageSize, pageIndex }) => {
      if (!currentEntity) return;
      setDataLoading(true);

      subsettingClient
        .getTabularData(studyMetadata.id, currentEntityID, {
          filters: analysisState.analysis?.descriptor.subset.descriptor ?? [],
          outputVariableIds: mergeKeys.concat(
            selectedVariableDescriptors
              .filter(
                (descriptor) => !mergeKeys.includes(descriptor.variableId)
              )
              .map((descriptor) => descriptor.variableId)
          ),
          reportConfig: {
            headerFormat: 'standard',
            trimTimeFromDateVars: true,
            paging: { numRows: pageSize, offset: pageSize * pageIndex },
          },
        })
        .then((data) => {
          setGridData(data);
          setPageCount(ceil(currentEntityRecordCounts.filtered! / pageSize));
        })
        .catch((error: Error) => {
          setApiError(JSON.parse(error.message.split('\n')[1]));
        })
        .finally(() => {
          setDataLoading(false);
        });
    },
    [
      currentEntityID,
      currentEntityRecordCounts.filtered,
      selectedVariableDescriptors,
      studyMetadata.id,
      subsettingClient,
      analysisState.analysis?.descriptor.subset.descriptor,
      currentEntity,
      mergeKeys,
    ]
  );

  // Function to download selected data.
  const downloadData = useCallback(() => {
    subsettingClient.tabularDataDownload(studyMetadata.id, currentEntityID, {
      filters: analysisState.analysis?.descriptor.subset.descriptor ?? [],
      outputVariableIds: selectedVariableDescriptors.map(
        (descriptor) => descriptor.variableId
      ),
      reportConfig: {
        headerFormat: 'display',
        trimTimeFromDateVars: true,
      },
    });
  }, [
    subsettingClient,
    selectedVariableDescriptors,
    currentEntityID,
    studyMetadata.id,
    analysisState.analysis?.descriptor.subset.descriptor,
  ]);

  /** Handler for when a user selects/de-selects variables. */
  const handleSelectedVariablesChange = (
    variableDescriptors: Array<VariableDescriptor>
  ) => {
    // Update the analysis to save the user's selections.
    analysisState.setDataTableConfig({
      ...analysisState.analysis?.descriptor.dataTableConfig,
      [currentEntityID]: { variables: variableDescriptors, sorting: null },
    });

    setSelectedVariableDescriptors(variableDescriptors);
  };

  /** Whenever `selectedVariableDescriptors` changes, load a new data set. */
  useEffect(() => {
    if (!displayModal) return;
    setApiError(null);
    fetchPaginatedData({ pageSize: 10, pageIndex: 0 });
  }, [fetchPaginatedData, displayModal]);

  // Render the table data or instructions on how to get started.
  const renderDataGridArea = () => {
    return (
      <div style={{ flex: 2, maxWidth: tableIsExpanded ? '100%' : '65%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 30,
            height: 30,
          }}
        >
          {!tableIsExpanded && (
            <NumberedHeader
              number={2}
              text={'View table and download'}
              color={primaryColor}
            />
          )}
          <span />
          <MesaButton
            text="Download"
            icon={Download}
            onPress={downloadData}
            themeRole="primary"
            textTransform="capitalize"
          />
        </div>
        {gridData ? (
          <div style={{ position: 'relative' }}>
            <DataGrid
              columns={gridColumns}
              data={gridRows}
              loading={dataLoading}
              stylePreset="mesa"
              styleOverrides={{
                headerCells: {
                  textTransform: 'none',
                  position: 'relative',
                  height: '100%',
                },
                table: {
                  width: '100%',
                  height: '100%',
                  overflow: 'auto',
                  borderStyle: undefined,
                  primaryRowColor: undefined,
                  secondaryRowColor: undefined,
                },
              }}
              pagination={{
                recordsPerPage: 10,
                controlsLocation: 'bottom',
                serverSidePagination: {
                  fetchPaginatedData,
                  pageCount,
                },
              }}
              extraHeaderControls={[
                (headerGroup) => (
                  <div
                    style={{ display: 'inline-block', width: 20, height: 20 }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                      }}
                    >
                      {requiredColumnAccessors?.includes(headerGroup.id) ? (
                        <i
                          className="fa fa-lock"
                          title="This column is required"
                          style={{ padding: '2px 6px' }}
                        />
                      ) : (
                        <button
                          onClick={() =>
                            handleSelectedVariablesChange(
                              selectedVariableDescriptors.filter(
                                (descriptor) =>
                                  descriptor.entityId +
                                    '/' +
                                    descriptor.variableId !==
                                  headerGroup.id
                              )
                            )
                          }
                          title="Remove column"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ),
              ]}
            />
            <button
              className="css-uaczjh-PaginationControls"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                // paddingLeft: 10,
                // paddingRight: 10,
                display: 'flex',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                width: 120,
              }}
              // @ts-ignore
              // icon={displayVariableTree ? CloseFullscreen : SettingsIcon}
              onClick={() => setTableIsExpanded(!tableIsExpanded)}
            >
              {/* <i className="fa fa-arrows-alt" /> */}
              {tableIsExpanded ? (
                <>
                  <FullscreenExitIcon />
                  Collapse table
                </>
              ) : (
                <>
                  <FullscreenIcon />
                  Expand table
                </>
              )}
            </button>
          </div>
        ) : !dataLoading ? (
          <div
            style={{
              border: '2px solid lightgray',
              padding: 10,
              borderRadius: 5,
              height: '25vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <H5
              text='To get started, click on the "Select Variables" button above.'
              additionalStyles={{ fontSize: 18 }}
            />
          </div>
        ) : (
          <Loading />
        )}
        {dataLoading && gridData ? <LoadingOverlay /> : null}
      </div>
    );
  };

  // Render the variable selection panel.
  const renderVariableSelectionArea = () => {
    const errorMessage = apiError
      ? apiError.message === 'Unable to fetch all required data'
        ? 'We are not currently able to fetch all the desired columns. Please reduce the number of selected columns.'
        : 'An unexpected error occurred while trying to retrieve the requested data.'
      : null;

    if ((!tableIsExpanded || errorMessage) && currentEntity) {
      return (
        <div style={{ flex: 1, minWidth: '25%' }}>
          <div style={{ marginBottom: 30, height: 30 }}>
            {!tableIsExpanded && (
              <NumberedHeader
                number={1}
                text={'Choose variables'}
                color={primaryColor}
              />
            )}
          </div>
          <div
            className="Variables"
            style={{
              // position: 'absolute',
              width: '100%',
              // left: entityDescriptionWidth + 195,
              // top: -54,
              backgroundColor: 'rgba(255, 255, 255, 1)',
              // border: '2px solid rgb(200, 200, 200)',
              // borderRadius: '.5em',
              // boxShadow: '0px 0px 6px rgba(0, 0, 0, .25)',
              // zIndex: '2',
            }}
          >
            {!requiredColumns.pending && requiredColumns.value && (
              <div
                className="EDAWorkspace-VariableList"
                style={{ marginBottom: 10 }}
              >
                <details
                  className="FeaturedVariables"
                  open={true}
                  style={{ backgroundColor: 'rgb(245,245,245)' }}
                >
                  <summary>
                    <h3>Required columns</h3>
                  </summary>
                  <ul>
                    {requiredColumns.value.map((column) => (
                      <li className="wdk-CheckboxTreeItem">
                        <div className="wdk-CheckboxTreeNodeContent wdk-AttributeFilterFieldItem">
                          <i
                            className="fa fa-lock"
                            style={{
                              position: 'relative',
                              left: -4,
                              marginRight: 5,
                            }}
                          />
                          <span>{column.Header}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            )}
            <MultiSelectVariableTree
              // NOTE: We are purposely removing all child entities here because
              // we only want a user to be able to select variables from a single
              // entity at a time.
              rootEntity={{ ...currentEntity, children: [] }}
              scope="download"
              selectedVariableDescriptors={
                selectedVariableDescriptorsWithMergeKeys
              }
              starredVariableDescriptors={scopedStarredVariables}
              featuredFields={scopedFeaturedFields}
              onSelectedVariablesChange={handleSelectedVariablesChange}
              toggleStarredVariable={toggleStarredVariable}
            />
          </div>
        </div>
      );
    }
  };

  return (
    <Modal
      title={safeHtml(studyRecord.displayName)}
      includeCloseButton={true}
      visible={displayModal}
      toggleVisible={toggleDisplay}
      onOpen={onModalOpen}
      onClose={onModalClose}
      themeRole="primary"
      styleOverrides={{
        content: {
          padding: {
            top: 0,
            right: 25,
            bottom: 25,
            left: 25,
          },
        },
      }}
    >
      <H5
        additionalStyles={{
          marginTop: 10,
          marginBottom: 25,
          fontStyle: 'italic',
        }}
        color={gray[700]}
      >
        {analysisState.analysis?.displayName}
      </H5>
      <div
        key="Controls"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ marginBottom: 15, display: 'flex' }}>
          <div style={{ marginRight: 25 }} ref={observeEntityDescription}>
            <span
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: '#646464',
              }}
            >
              {currentEntity?.displayNamePlural}
            </span>
            {currentEntityRecordCounts.filtered &&
              currentEntityRecordCounts.total && (
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: 0,
                    color: 'gray',
                  }}
                >
                  {`${currentEntityRecordCounts.filtered.toLocaleString()} of ${currentEntityRecordCounts.total.toLocaleString()} records selected`}
                </p>
              )}
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          gap: 50,
          marginTop: 15,
        }}
      >
        {renderVariableSelectionArea()}
        {renderDataGridArea()}
      </div>
    </Modal>
  );
}
