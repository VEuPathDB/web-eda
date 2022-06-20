/* eslint-disable @typescript-eslint/no-redeclare */

import {
  TypeOf,
  string,
  number,
  array,
  type,
  tuple,
  union,
  intersection,
  partial,
  unknown,
  nullType,
} from 'io-ts';
import { Filter } from '../../types/filter';
import {
  BinSpec,
  BinWidthSlider,
  TimeUnit,
  NumberOrNull,
  NumberOrDateRange,
} from '../../types/general';
import { VariableDescriptor, StringVariableValue } from '../../types/variable';
import { ComputationAppOverview } from '../../types/visualization';

export const AppsResponse = type({
  apps: array(ComputationAppOverview),
});

type ZeroToTwoVariables =
  | []
  | [VariableDescriptor]
  | [VariableDescriptor, VariableDescriptor];

// define sampleSizeTableArray
export type SampleSizeTableArray = TypeOf<typeof sampleSizeTableArray>;
const sampleSizeTableArray = array(
  intersection([
    type({
      size: array(number),
    }),
    partial({
      facetVariableDetails: union([
        tuple([StringVariableValue]),
        tuple([StringVariableValue, StringVariableValue]),
      ]),
      geoAggregateVariableDetails: StringVariableValue,
      overlayVariableDetails: StringVariableValue,
      xVariableDetails: type({
        entityId: string,
        variableId: string,
        value: union([string, array(string)]),
      }),
    }),
  ])
);

// define completeCases
export type CompleteCasesTableRow = TypeOf<typeof completeCases>;
const completeCases = partial({
  // set union for size as it depends on the presence of overlay variable
  completeCases: number,
  variableDetails: type({
    entityId: string,
    variableId: string,
  }),
});

// define completeCasesTableArray
export type CompleteCasesTable = TypeOf<typeof completeCasesTableArray>;
const completeCasesTableArray = array(completeCases);

export interface HistogramRequestParams {
  studyId: string;
  filters: Filter[];
  //  derivedVariables:  // TO DO
  config: {
    outputEntityId: string;
    valueSpec: 'count' | 'proportion';
    barMode: 'overlay' | 'stack';
    xAxisVariable: VariableDescriptor;
    overlayVariable?: VariableDescriptor; // TO DO: should this be StringVariable??
    facetVariable?: ZeroToTwoVariables; // ditto here
    binSpec: {
      type: 'binWidth' | 'numBins';
      value?: number;
      units?: TimeUnit;
    };
    viewport?: {
      xMin: string;
      xMax: string;
    };
    showMissingness?: 'TRUE' | 'FALSE';
  };
}

export type HistogramResponse = TypeOf<typeof HistogramResponse>;
export const HistogramResponse = type({
  histogram: type({
    data: array(
      intersection([
        type({
          binLabel: array(string),
          binStart: array(string),
          binEnd: array(string),
          value: array(number),
        }),
        partial({
          overlayVariableDetails: StringVariableValue,
          facetVariableDetails: union([
            tuple([StringVariableValue]),
            tuple([StringVariableValue, StringVariableValue]),
          ]),
        }),
      ])
    ),
    config: type({
      completeCasesAllVars: number,
      completeCasesAxesVars: number,
      binSlider: BinWidthSlider,
      xVariableDetails: VariableDescriptor,
      binSpec: BinSpec,
      summary: type({
        min: string,
        q1: string,
        median: string,
        mean: string,
        q3: string,
        max: string,
      }),
      viewport: type({
        xMin: string,
        xMax: string,
      }),
    }),
  }),
  sampleSizeTable: sampleSizeTableArray,
  completeCasesTable: completeCasesTableArray,
});

export interface BarplotRequestParams {
  studyId: string;
  filters: Filter[];
  //  derivedVariables:  // TO DO
  config: {
    outputEntityId: string;
    // add proportion as it seems to be coming
    valueSpec: 'count' | 'identity' | 'proportion';
    barMode: 'group' | 'stack';
    xAxisVariable: VariableDescriptor;
    overlayVariable?: VariableDescriptor;
    facetVariable?: ZeroToTwoVariables;
    showMissingness?: 'TRUE' | 'FALSE';
  };
}

export type BarplotResponse = TypeOf<typeof BarplotResponse>;
export const BarplotResponse = type({
  barplot: type({
    config: type({
      completeCasesAllVars: number,
      completeCasesAxesVars: number,
      xVariableDetails: type({
        variableId: string,
        entityId: string,
      }),
    }),
    data: array(
      intersection([
        type({
          label: array(string),
          value: array(number),
        }),
        partial({
          overlayVariableDetails: type({
            entityId: string,
            variableId: string,
            value: string,
          }),
          facetVariableDetails: union([
            tuple([StringVariableValue]),
            tuple([StringVariableValue, StringVariableValue]),
          ]),
        }),
      ])
    ),
  }),
  sampleSizeTable: sampleSizeTableArray,
  completeCasesTable: completeCasesTableArray,
});

// scatterplot
export interface ScatterplotRequestParams {
  studyId: string;
  filters: Filter[];
  config: {
    outputEntityId: string;
    valueSpec:
      | 'raw'
      | 'smoothedMean'
      | 'smoothedMeanWithRaw'
      | 'bestFitLineWithRaw';
    xAxisVariable: VariableDescriptor;
    yAxisVariable: VariableDescriptor;
    overlayVariable?: VariableDescriptor;
    facetVariable?: ZeroToTwoVariables;
    showMissingness?: 'TRUE' | 'FALSE';
    maxAllowedDataPoints?: number;
  };
}

// unlike API doc, data (response) shows seriesX, seriesY, smoothedMeanX, smoothedMeanY, smoothedMeanSE
export const ScatterplotResponseData = array(
  partial({
    // valueSpec = smoothedMean only returns smoothedMean data (no series data)
    // changed to string array
    seriesX: array(string),
    seriesY: array(string),
    smoothedMeanX: array(string),
    smoothedMeanY: array(number),
    smoothedMeanSE: array(number),
    // add bestFitLineWithRaw
    bestFitLineX: array(string),
    bestFitLineY: array(number),
    // allow null for r2
    r2: NumberOrNull,
    // need to make sure if below is correct (untested)
    overlayVariableDetails: type({
      entityId: string,
      variableId: string,
      value: string,
    }),
    facetVariableDetails: union([
      tuple([StringVariableValue]),
      tuple([StringVariableValue, StringVariableValue]),
    ]),
  })
);

// typing computedVariableMetadata for computation apps such as alphadiv and abundance
export type ComputedVariableMetadata = TypeOf<typeof ComputedVariableMetadata>;
export const ComputedVariableMetadata = partial({
  displayName: array(string),
  displayRangeMin: string,
  displayRangeMax: string,
  // collectionVariable for abundance app
  collectionVariable: partial({
    collectionType: string,
    collectionValuePlotRef: string, // e.g., yAxisVariable
    collectionVariablePlotRef: string, // e.g., overlayVariable
    collectionVariableDetails: array(VariableDescriptor),
  }),
});

export type ScatterplotResponse = TypeOf<typeof ScatterplotResponse>;
export const ScatterplotResponse = type({
  scatterplot: type({
    data: ScatterplotResponseData,
    // typing computedVariableMetadata for computation apps such as alphadiv and abundance
    config: intersection([
      type({
        completeCasesAllVars: number,
        completeCasesAxesVars: number,
        xVariableDetails: type({
          variableId: string,
          entityId: string,
        }),
        yVariableDetails: type({
          variableId: string,
          entityId: string,
        }),
      }),
      partial({
        computedVariableMetadata: ComputedVariableMetadata,
      }),
    ]),
  }),
  sampleSizeTable: sampleSizeTableArray,
  completeCasesTable: completeCasesTableArray,
});

////////////////
// Table Data //
////////////////
export interface TableDataRequestParams {
  studyId: string;
  config: {
    outputEntityId: string;
    outputVariable: Array<VariableDescriptor>;
    pagingConfig: {
      numRows: number;
      offset: number;
    };
  };
}

export type TableDataResponse = TypeOf<typeof TableDataResponse>;
export const TableDataResponse = type({
  columns: array(VariableDescriptor),
  rows: array(array(string)),
});

// lineplot
export interface LineplotRequestParams {
  studyId: string;
  filters: Filter[];
  config: {
    outputEntityId: string;
    xAxisVariable: VariableDescriptor;
    yAxisVariable: VariableDescriptor;
    overlayVariable?: VariableDescriptor;
    facetVariable?: ZeroToTwoVariables;
    binSpec: BinSpec;
    viewport?: {
      xMin: string;
      xMax: string;
    };
    showMissingness?: 'TRUE' | 'FALSE';
    valueSpec: 'mean' | 'median' | 'proportion';
    errorBars: 'TRUE' | 'FALSE';
    yAxisNumeratorValues?: string[];
    yAxisDenominatorValues?: string[];
  };
}

const LineplotResponseData = array(
  intersection([
    type({
      seriesX: array(string),
      seriesY: array(union([string, nullType])),
    }),
    partial({
      binStart: array(string),
      binEnd: array(string),
      errorBars: array(
        type({
          lowerBound: union([NumberOrNull, array(unknown)]), // TEMPORARY
          upperBound: union([NumberOrNull, array(unknown)]), // back end will return number or null
          error: string,
        })
      ),
      binSampleSize: union([
        array(
          type({
            N: number,
          })
        ),
        array(
          type({
            numeratorN: number,
            denominatorN: number,
          })
        ),
      ]),
      overlayVariableDetails: StringVariableValue,
      facetVariableDetails: union([
        tuple([StringVariableValue]),
        tuple([StringVariableValue, StringVariableValue]),
      ]),
    }),
  ])
);

export type LineplotResponse = TypeOf<typeof LineplotResponse>;
export const LineplotResponse = type({
  lineplot: type({
    data: LineplotResponseData,
    config: intersection([
      type({
        completeCasesAllVars: number,
        completeCasesAxesVars: number,
        xVariableDetails: type({
          variableId: string,
          entityId: string,
        }),
        yVariableDetails: type({
          variableId: string,
          entityId: string,
        }),
      }),
      partial({
        binSlider: BinWidthSlider,
        binSpec: BinSpec,
      }),
    ]),
  }),
  sampleSizeTable: sampleSizeTableArray,
  completeCasesTable: completeCasesTableArray,
});

export interface MosaicRequestParams {
  studyId: string;
  filters: Filter[];
  config: {
    outputEntityId: string;
    xAxisVariable: VariableDescriptor;
    yAxisVariable: VariableDescriptor;
    facetVariable: ZeroToTwoVariables;
    showMissingness?: 'TRUE' | 'FALSE';
  };
}

export type MosaicResponse = TypeOf<typeof MosaicResponse>;
export const MosaicResponse = type({
  mosaic: type({
    data: array(
      intersection([
        type({
          xLabel: array(string),
          yLabel: array(array(string)),
          value: array(array(number)),
        }),
        partial({
          facetVariableDetails: union([
            tuple([StringVariableValue]),
            tuple([StringVariableValue, StringVariableValue]),
          ]),
        }),
      ])
    ),
    config: type({
      completeCasesAllVars: number,
      completeCasesAxesVars: number,
      xVariableDetails: type({
        variableId: string,
        entityId: string,
      }),
      yVariableDetails: type({
        variableId: string,
        entityId: string,
      }),
    }),
  }),
  sampleSizeTable: array(
    type({
      size: array(number),
    })
  ),
  completeCasesTable: completeCasesTableArray,
});

export type ContTableResponse = TypeOf<typeof ContTableResponse>;
export const ContTableResponse = intersection([
  MosaicResponse,
  partial({
    statsTable: array(
      partial({
        pvalue: union([number, string]), // TO DO: should these three stats values all be optional?
        degreesFreedom: number,
        chisq: number,
        facetVariableDetails: union([
          tuple([StringVariableValue]),
          tuple([StringVariableValue, StringVariableValue]),
        ]),
      })
    ),
  }),
]);

export type TwoByTwoResponse = TypeOf<typeof TwoByTwoResponse>;
export const TwoByTwoResponse = intersection([
  MosaicResponse,
  partial({
    statsTable: array(
      partial({
        oddsratio: NumberOrNull, // TO DO: should these stats values really all be optional?
        pvalue: union([number, string]),
        orInterval: string,
        rrInterval: string,
        relativerisk: number,
        facetVariableDetails: union([
          tuple([StringVariableValue]),
          tuple([StringVariableValue, StringVariableValue]),
        ]),
      })
    ),
    completeCasesTable: completeCasesTableArray,
  }),
]);

// boxplot
export interface BoxplotRequestParams {
  studyId: string;
  filters: Filter[];
  config: {
    outputEntityId: string;
    // add bestFitLineWithRaw
    points: 'outliers' | 'all';
    mean: 'TRUE' | 'FALSE';
    xAxisVariable: VariableDescriptor;
    yAxisVariable: VariableDescriptor;
    overlayVariable?: VariableDescriptor;
    facetVariable?: ZeroToTwoVariables;
    showMissingness?: 'TRUE' | 'FALSE';
  };
}

// unlike API doc, data (response) shows seriesX, seriesY, smoothedMeanX, smoothedMeanY, smoothedMeanSE
const BoxplotResponseData = array(
  intersection([
    type({
      lowerfence: array(number),
      upperfence: array(number),
      q1: array(number),
      q3: array(number),
      median: array(number),
      label: array(string),
    }),
    partial({
      // outliers
      // back end is returning {} instead of [], e.g.
      // [ {}, [1,2,3], [4,5,6] ]
      outliers: array(array(number)),
      rawData: array(array(number)),
      // mean: array(number),
      mean: array(number),
      seriesX: union([array(string), array(number)]),
      seriesY: array(number),
      // need to make sure if below is correct (untested)
      overlayVariableDetails: type({
        entityId: string,
        variableId: string,
        value: string,
      }),
      facetVariableDetails: union([
        tuple([StringVariableValue]),
        tuple([StringVariableValue, StringVariableValue]),
      ]),
    }),
  ])
);

// boxplot stats table
export type BoxplotStatsTable = TypeOf<typeof BoxplotStatsTable>;
export const BoxplotStatsTable = partial({
  xVariableDetails: type({
    variableId: string,
    entityId: string,
    value: string,
  }),
  facetVariableDetails: array(
    type({
      variableId: string,
      entityId: string,
      value: string,
    })
  ),
  parameter: union([number, array(number), nullType]),
  pvalue: union([number, array(number), nullType]),
  statistic: union([number, array(number), nullType]),
  method: union([string, array(string), nullType]),
  statsError: string,
});

export type BoxplotResponse = TypeOf<typeof BoxplotResponse>;
export const BoxplotResponse = intersection([
  type({
    boxplot: type({
      data: BoxplotResponseData,
      // typing computedVariableMetadata for computation apps such as alphadiv and abundance
      config: intersection([
        type({
          completeCasesAllVars: number,
          completeCasesAxesVars: number,
          xVariableDetails: type({
            variableId: string,
            entityId: string,
          }),
          yVariableDetails: type({
            variableId: string,
            entityId: string,
          }),
        }),
        partial({
          computedVariableMetadata: ComputedVariableMetadata,
        }),
      ]),
    }),
    sampleSizeTable: sampleSizeTableArray,
    completeCasesTable: completeCasesTableArray,
  }),
  partial({
    statsTable: array(BoxplotStatsTable),
  }),
]);

export interface MapMarkersRequestParams {
  studyId: string;
  filters: Filter[];
  config: {
    outputEntityId: string;
    geoAggregateVariable: VariableDescriptor;
    latitudeVariable: VariableDescriptor;
    longitudeVariable: VariableDescriptor;
    viewport: {
      latitude: {
        xMin: number;
        xMax: number;
      };
      longitude: {
        left: number;
        right: number;
      };
    };
  };
}

export type MapMarkersResponse = TypeOf<typeof MapMarkersResponse>;
export const MapMarkersResponse = type({
  mapElements: array(
    type({
      geoAggregateValue: string,
      entityCount: number,
      avgLat: number,
      avgLon: number,
      minLat: number,
      minLon: number,
      maxLat: number,
      maxLon: number,
    })
  ),
  config: type({
    completeCasesGeoVar: number,
  }),
});

export interface MapMarkersOverlayRequestParams {
  studyId: string;
  filters: Filter[];
  config: {
    outputEntityId: string;
    showMissingness:
      | 'TRUE'
      | 'FALSE'
      | 'noVariables'
      | 'allVariables'
      | 'strataVariables';
    xAxisVariable: VariableDescriptor;
    latitudeVariable: VariableDescriptor;
    longitudeVariable: VariableDescriptor;
    geoAggregateVariable: VariableDescriptor;
    valueSpec: 'count' | 'proportion';
    binSpec: {
      type?: 'binWidth' | 'numBins';
      value?: NumberOrNull;
      units?: TimeUnit;
      range?: NumberOrDateRange;
    };
    viewport: {
      latitude: {
        xMin: number;
        xMax: number;
      };
      longitude: {
        left: number;
        right: number;
      };
    };
  };
}

export type MapMarkersOverlayResponse = TypeOf<
  typeof MapMarkersOverlayResponse
>;
export const MapMarkersOverlayResponse = type({
  mapMarkers: type({
    data: array(
      type({
        label: array(string),
        value: array(number),
        geoAggregateVariableDetails: StringVariableValue,
      })
    ),
    config: intersection([
      type({
        completeCasesAllVars: number,
        completeCasesAxesVars: number,
        rankedValues: array(string),
        overlayValues: array(string),
        viewport: type({
          latitude: type({
            xMin: number,
            xMax: number,
          }),
          longitude: type({
            left: number,
            right: number,
          }),
        }),
        xVariableDetails: type({
          variableId: string,
          entityId: string,
        }),
      }),
      partial({
        binSpec: BinSpec,
        binSlider: BinWidthSlider,
      }),
    ]),
  }),
  sampleSizeTable: sampleSizeTableArray,
  completeCasesTable: completeCasesTableArray,
});
