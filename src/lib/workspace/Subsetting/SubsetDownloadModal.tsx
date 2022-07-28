/** @jsxImportSource @emotion/react */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ceil } from 'lodash';

// Components & Component Generators
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import { safeHtml } from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import {
  Loading,
  LoadingOverlay,
  HelpIcon,
} from '@veupathdb/wdk-client/lib/Components';
import MultiSelectVariableTree from '../../core/components/variableTrees/MultiSelectVariableTree';
import { Modal, DataGrid, MesaButton, Download } from '@veupathdb/coreui';

// Definitions
import { AnalysisState } from '../../core/hooks/analysis';
import { TabularDataResponse, usePromise } from '../../core';
import { VariableDescriptor } from '../../core/types/variable';
import { APIError } from '../../core/api/types';
import { useUITheme } from '@veupathdb/coreui/dist/components/theming';
import {
  EnhancedEntityData,
  EnhancedEntityDatum,
} from '../DownloadTab/hooks/useEnhancedEntityData';
import { gray } from '@veupathdb/coreui/dist/definitions/colors';

// Hooks
import {
  useStudyMetadata,
  useStudyRecord,
  useSubsettingClient,
} from '../../core';
import useDimensions from 'react-cool-dimensions';

import { useFeaturedFields } from '../../core/components/variableTrees/hooks';
import { useProcessedGridData, processGridData } from './hooks';
import tableSVG from './cartoon_table.svg';
import {
  DataGridProps,
  SortBy,
} from '@veupathdb/coreui/dist/components/grids/DataGrid';
import { stripHTML } from '@veupathdb/wdk-client/lib/Utils/DomUtils';

type SubsetDownloadModalProps = {
  /** Should the modal currently be visible? */
  displayModal: boolean;
  /** Toggle the display of the modal. */
  toggleDisplay: () => void;
  /** Analysis state. We will read/write to this object. */
  analysisState: AnalysisState;
  /** The entities for the Study/Analysis being interacted with. */
  entities: EnhancedEntityData;
  currentEntity: EnhancedEntityDatum;
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
export default function SubsetDownloadModal({
  displayModal,
  toggleDisplay,
  analysisState,
  entities,
  currentEntity,
  starredVariables,
  toggleStarredVariable,
}: SubsetDownloadModalProps) {
  const theme = useUITheme();
  const primaryColor = theme?.palette.primary.hue[theme.palette.primary.level];

  //   Various Custom Hooks
  const studyRecord = useStudyRecord();
  const studyMetadata = useStudyMetadata();
  const subsettingClient = useSubsettingClient();
  const featuredFields = useFeaturedFields(entities, 'download');

  const scopedFeaturedFields = useMemo(
    () =>
      featuredFields.filter((field) =>
        field.term.startsWith(currentEntity.id + '/')
      ),
    [currentEntity, featuredFields]
  );

  const scopedStarredVariables = useMemo(
    () =>
      starredVariables?.filter(
        (variable) => variable.entityId === currentEntity.id
      ) ?? [],
    [currentEntity, starredVariables]
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
    analysisState.analysis?.descriptor.dataTableConfig[currentEntity.id]
      ?.variables ?? []
  );

  useEffect(() => {
    /** Actions to take when modal is closed. */
    if (!displayModal) {
      setGridData(null);
      setTableIsExpanded(false);
    }
  }, [displayModal]);

  const mergeKeys = useMemo(() => {
    if (!currentEntity) return [];
    return currentEntity.variables
      .filter((variable) => 'isMergeKey' in variable && variable.isMergeKey)
      .map((mergeKey) => mergeKey.id);
  }, [currentEntity]);

  const [sortBy, setSortBy] = useState<SortBy>([]);

  // Required columns
  const requiredColumns = usePromise(
    useCallback(async () => {
      const data = await subsettingClient.getTabularData(
        studyMetadata.id,
        currentEntity.id,
        {
          filters: [],
          outputVariableIds: mergeKeys,
          reportConfig: {
            headerFormat: 'standard',
            paging: { numRows: 1, offset: 0 },
          },
        }
      );
      return processGridData(data, entities, currentEntity)[0];
    }, [subsettingClient, studyMetadata.id, entities, currentEntity, mergeKeys])
  );

  const requiredColumnAccessors = requiredColumns.value?.map(
    (column) => column.accessor
  );

  const selectedVariableDescriptorsWithMergeKeys = useMemo(() => {
    if (!currentEntity) return [];
    return mergeKeys
      .map((key) => {
        return { entityId: currentEntity?.id, variableId: key };
      })
      .concat(selectedVariableDescriptors);
  }, [mergeKeys, selectedVariableDescriptors, currentEntity]);

  const fetchPaginatedData: Required<
    Required<DataGridProps>['pagination']
  >['serverSidePagination']['fetchPaginatedData'] = useCallback(
    ({ pageSize, pageIndex, sortBy }) => {
      if (!currentEntity) return;
      setDataLoading(true);
      setSortBy(sortBy ?? []);

      const selectedVariableIds = selectedVariableDescriptorsWithMergeKeys.map(
        (descriptor) => descriptor.variableId
      );
      const filteredSortBy = sortBy?.filter((column) =>
        selectedVariableIds.includes(column.id.split('/')[1])
      );

      subsettingClient
        .getTabularData(studyMetadata.id, currentEntity.id, {
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
            sorting: filteredSortBy?.map(({ id, desc }) => ({
              key: id.split('/')[1],
              direction: desc ? 'desc' : 'asc',
            })),
          },
        })
        .then((data) => {
          setGridData(data);
          setPageCount(ceil(currentEntity.filteredCount! / pageSize));
        })
        .catch((error: Error) => {
          setApiError(JSON.parse(error.message.split('\n')[1]));
        })
        .finally(() => {
          setDataLoading(false);
        });
    },
    [
      selectedVariableDescriptors,
      selectedVariableDescriptorsWithMergeKeys,
      studyMetadata.id,
      subsettingClient,
      analysisState.analysis?.descriptor.subset.descriptor,
      currentEntity,
      mergeKeys,
    ]
  );

  // Function to download selected data.
  const downloadData = useCallback(() => {
    subsettingClient.tabularDataDownload(studyMetadata.id, currentEntity.id, {
      filters: analysisState.analysis?.descriptor.subset.descriptor ?? [],
      outputVariableIds: [
        ...mergeKeys,
        ...selectedVariableDescriptors.map(
          (descriptor) => descriptor.variableId
        ),
      ],
      reportConfig: {
        headerFormat: 'display',
        trimTimeFromDateVars: true,
      },
    });
  }, [
    mergeKeys,
    subsettingClient,
    selectedVariableDescriptors,
    currentEntity,
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
      [currentEntity.id]: { variables: variableDescriptors, sorting: null },
    });

    setSelectedVariableDescriptors(variableDescriptors);
  };

  /** Whenever `selectedVariableDescriptors` changes, load a new data set. */
  useEffect(() => {
    if (!displayModal) return;
    setApiError(null);
    fetchPaginatedData({ pageSize: 10, pageIndex: 0, sortBy });
  }, [fetchPaginatedData, displayModal, sortBy]);

  const dataGridWrapperRef = useRef<HTMLDivElement>(null);

  // This is to fix a strange layout bug with the table header icons on Firefox
  // where they won't sit at the top right of the header cells
  useEffect(() => {
    // The recommended duck-typing to determine whether the browser is Firefox
    // @ts-ignore
    const browserIsFirefox = typeof InstallTrigger !== 'undefined';

    if (browserIsFirefox && dataGridWrapperRef.current) {
      // We're essentially going to set the div inside each table header cell
      // to the same height as the header row itself
      const headerDivElements = [
        ...dataGridWrapperRef.current.getElementsByTagName('th'),
      ].flatMap(
        (headerElement) => (headerElement.firstChild as HTMLDivElement) ?? []
      );

      // We need to do this by finding the height of the tallest header text
      // node (trying to use the header row height directly causes it to grow
      // slightly each time and never shrink)
      let maxHeight = 0;

      for (const divElement of headerDivElements) {
        const textNode = divElement.firstChild as Text;
        const range = document.createRange();
        range.selectNodeContents(textNode);
        const height = range.getBoundingClientRect().height;
        maxHeight = height > maxHeight ? height : maxHeight;
      }

      for (const divElement of headerDivElements) {
        const paddingSize = 10;
        divElement.style.height =
          (maxHeight + 2 * paddingSize).toString() + 'px';
      }
    }
    // We should do this whenever there's new data or the table size changes
  }, [dataLoading, tableIsExpanded]);

  const headerMarginBottom = 15;

  // Render the table data or instructions on how to get started.
  const renderDataGridArea = () => {
    return (
      <div
        style={{
          flex: 2,
          maxWidth: tableIsExpanded ? '100%' : '65%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: headerMarginBottom,
            height: 30,
          }}
        >
          {!tableIsExpanded && (
            <NumberedHeader
              number={2}
              text={'View table and download'}
              color={
                selectedVariableDescriptors.length > 0
                  ? primaryColor
                  : 'darkgrey'
              }
            />
          )}
          <span />
          {selectedVariableDescriptors.length > 0 && (
            <MesaButton
              text="Download"
              icon={Download}
              onPress={downloadData}
              themeRole="primary"
              textTransform="capitalize"
            />
          )}
        </div>
        {gridData ? (
          selectedVariableDescriptors.length > 0 ? (
            <div
              css={{
                position: 'relative',
                flex: '0 1 auto',
                minHeight: 0,
                '.css-1nxo5ei-HeaderCell': { height: 'auto' },
              }}
              className="DataGrid-Wrapper"
              ref={dataGridWrapperRef}
            >
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
                  size: {
                    height: '100%',
                  },
                  paginationControls: {
                    bottom: {
                      margin: {
                        top: 10,
                        bottom: 0,
                      },
                    },
                  },
                  icons: {
                    inactiveColor: gray[400],
                    activeColor: gray[900],
                  },
                }}
                sortable
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
                          margin: 3,
                          fontSize: 11,
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
                            onClick={(event) => {
                              event.stopPropagation();

                              if (selectedVariableDescriptors.length === 1)
                                setTableIsExpanded(false);

                              handleSelectedVariablesChange(
                                selectedVariableDescriptors.filter(
                                  (descriptor) =>
                                    descriptor.entityId +
                                      '/' +
                                      descriptor.variableId !==
                                    headerGroup.id
                                )
                              );
                            }}
                            title="Remove column"
                            css={{
                              background: 'none',
                              border: 'none',
                              borderRadius: 2,
                              color: 'inherit',
                              '&:hover': {
                                background: '#e6e6e6',
                              },
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
                  display: 'flex',
                  justifyContent: 'space-evenly',
                  alignItems: 'center',
                  width: 120,
                }}
                onClick={() => setTableIsExpanded(!tableIsExpanded)}
              >
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
              {dataLoading && <LoadingOverlay />}
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                paddingTop: 25,
              }}
            >
              <img
                src={tableSVG}
                title="Choose a variable to see the table"
                alt="Choose a variable to see the table"
                width={400}
              />
            </div>
          )
        ) : dataLoading ? (
          <Loading />
        ) : null}
      </div>
    );
  };

  const LockIcon = () => (
    <div
      style={{
        width: 13,
        height: 13,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '1px 4px 1px 0',
      }}
      onClick={(event) => event.preventDefault()}
    >
      <i className="fa fa-lock" title="This variable is required" />
    </div>
  );
  const customCheckboxes = mergeKeys.reduce(
    (checkboxes, mergeKey) => ({
      ...checkboxes,
      [currentEntity.id + '/' + mergeKey]: LockIcon,
    }),
    {}
  );

  // Render the variable selection panel.
  const renderVariableSelectionArea = () => {
    const errorMessage = apiError
      ? apiError.message === 'Unable to fetch all required data'
        ? 'We are not currently able to fetch all the desired columns. Please reduce the number of selected columns.'
        : 'An unexpected error occurred while trying to retrieve the requested data.'
      : null;

    if ((!tableIsExpanded || errorMessage) && currentEntity) {
      return (
        <div
          style={{
            flex: 1,
            minWidth: '25%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ marginBottom: headerMarginBottom, height: 30 }}>
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
            css={{
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 1)',
              overflow: 'auto',
              minHeight: 0,
              flex: '0 1 auto',
              '& .EDAWorkspace-VariableList': {
                height: 'auto',
                display: 'block',
              },
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
                  style={{
                    backgroundColor: 'rgb(245,245,245)',
                    height: 'auto',
                  }}
                >
                  <summary>
                    <h3>
                      Required columns{' '}
                      <span css={{ '& i': { verticalAlign: 'bottom' } }}>
                        <HelpIcon>
                          Required columns are unique identifiers needed to
                          merge data across download files.
                        </HelpIcon>
                      </span>
                    </h3>
                  </summary>
                  <ul>
                    {requiredColumns.value.map((column) => (
                      <li
                        className="wdk-CheckboxTreeItem"
                        key={column.accessor}
                      >
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
              filterEntity={(e) => e.id === currentEntity.id}
              scope="download"
              selectedVariableDescriptors={selectedVariableDescriptors}
              starredVariableDescriptors={scopedStarredVariables}
              featuredFields={scopedFeaturedFields}
              onSelectedVariablesChange={handleSelectedVariablesChange}
              toggleStarredVariable={toggleStarredVariable}
              customCheckboxes={customCheckboxes}
              startExpanded
            />
          </div>
        </div>
      );
    }
  };

  const {
    observe: observeModalHeader,
    width: modalHeaderWidth,
  } = useDimensions();

  // ~18px (round to 20px) per character for medium title size
  const maxStudyNameLength = Math.floor(modalHeaderWidth / 20);
  const studyNameNoTags = stripHTML(studyRecord.displayName);
  let studyNameElement: JSX.Element;

  if (studyNameNoTags.length > maxStudyNameLength) {
    const tagCharCount =
      studyRecord.displayName.length - studyNameNoTags.length;
    const studyNameTrunc = studyRecord.displayName.substring(
      0,
      maxStudyNameLength + tagCharCount - 2
    );
    // This regex works as long as every < or > in the study name is part of an HTML tag
    const regexUnclosedTag = /<(?!.*>).*/;
    const studyNameNoUnclosedTag = studyNameTrunc.replace(regexUnclosedTag, '');
    studyNameElement = safeHtml(studyNameNoUnclosedTag + '...', {
      title: studyNameNoTags,
    });
  } else {
    studyNameElement = safeHtml(studyRecord.displayName);
  }

  // 14px for subtitle at medium title size
  const analysisName = analysisState.analysis?.displayName;
  const maxAnalysisNameLength = Math.floor(modalHeaderWidth / 14);
  const analysisNameElement =
    analysisName &&
    (analysisName.length > maxAnalysisNameLength ? (
      <span title={analysisName}>
        {analysisName.substring(0, maxAnalysisNameLength - 2) + '...'}
      </span>
    ) : (
      analysisName
    ));

  return (
    <Modal
      title={
        <div style={{ width: '100%' }} ref={observeModalHeader}>
          {studyNameElement}
        </div>
      }
      subtitle={analysisNameElement && <i>{analysisNameElement}</i>}
      titleSize="medium"
      compactTitle
      includeCloseButton={true}
      visible={displayModal}
      toggleVisible={toggleDisplay}
      themeRole="primary"
      className="SubsetDownloadModal"
      styleOverrides={{
        content: {
          padding: {
            top: 0,
            right: 25,
            bottom: 25,
            left: 25,
          },
          size: {
            height: '100%',
          },
        },
      }}
    >
      <div css={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div css={{ display: 'flex', flexDirection: 'column' }}>
          <div
            css={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 10,
              marginBottom: 15,
              height: '100%',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: gray[600],
                }}
              >
                {currentEntity?.displayNamePlural}
              </span>
              {currentEntity.filteredCount && currentEntity.totalCount && (
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: 0,
                    color: 'gray',
                  }}
                >
                  {`${currentEntity.filteredCount.toLocaleString()} of ${currentEntity.totalCount.toLocaleString()} records selected`}
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
            minHeight: 0,
            flex: '0 1 auto',
          }}
        >
          {renderVariableSelectionArea()}
          {renderDataGridArea()}
        </div>
      </div>
    </Modal>
  );
}