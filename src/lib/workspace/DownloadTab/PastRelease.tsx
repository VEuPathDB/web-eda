import { useMemo, useState } from 'react';
import { Column } from 'react-table';

// Components
import { colors, DataGrid, Download } from '@veupathdb/core-components';

// Definitions
import { DownloadClient } from '../../core/api/DownloadClient';
import { DownloadTabStudyRelease } from './types';

// Hooks
import { ReleaseFile, useGetReleaseFiles } from './hooks/useGetReleaseFiles';
import { ExpandablePanel } from '@veupathdb/core-components/dist/components/containers';

export type PastReleaseProps = {
  studyId: string;
  release: DownloadTabStudyRelease;
  downloadClient: DownloadClient;
};

export default function PastRelease({
  studyId,
  release,
  downloadClient,
}: PastReleaseProps) {
  const [releaseFiles, setReleaseFiles] = useState<Array<ReleaseFile>>([]);
  const memoizedReleaseFiles = useMemo(() => releaseFiles, [releaseFiles]);

  useGetReleaseFiles(studyId, release, downloadClient, setReleaseFiles);

  const exampleGridColumns: Array<Column> = [
    {
      Header: 'File Description',
      accessor: (row: any) => ({
        description: row.fileDescription,
        url: row.fileUrl,
        name: row.fileName,
      }),
      Cell: ({ value }) => {
        return (
          <a
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: colors.mutedCyan[500],
            }}
            href={value.url}
            download={value.name}
            target="_blank"
            rel="noreferrer"
          >
            <Download fill={colors.mutedCyan[500]} fontSize={20} />
            <span
              style={{
                fontFamily: 'Inter',
                fontWeight: 600,
                letterSpacing: 0.1,
                marginLeft: 8,
                marginRight: 25,
              }}
            >
              {value.description}
            </span>
          </a>
        );
      },
    },
    {
      Header: 'Type',
      accessor: 'fileType',
    },
    {
      Header: 'Size',
      accessor: 'fileSize',
      Cell: ({ value }) => <span>{value} MB</span>,
    },
  ];

  return (
    <div id="Current Release Dataset" style={{ marginBottom: 35 }}>
      <ExpandablePanel
        stylePreset="floating"
        themeRole="primary"
        title={`Full Dataset (Release ${release.releaseNumber})`}
        subTitle={{
          Date: release.date ?? '',
          Changelog: release.description ?? '',
        }}
      >
        <div style={{ padding: 15, paddingLeft: 35 }}>
          {releaseFiles.length ? (
            <DataGrid
              columns={exampleGridColumns}
              data={memoizedReleaseFiles}
              styleOverrides={{
                table: {
                  borderColor: colors.mutedCyan[200],
                  borderStyle: 'solid',
                  primaryRowColor: 'transparent',
                  secondaryRowColor: 'transparent',
                  borderWidth: 2,
                },
                headerCells: {
                  color: colors.gray[600],
                  backgroundColor: colors.mutedCyan[200],
                  fontWeight: 700,
                  borderColor: colors.mutedCyan[200],
                  borderWidth: 2,
                  borderStyle: 'solid',
                  fontSize: 12,
                  fontFamily: 'Inter',
                },
                dataCells: {
                  color: colors.gray[600],
                  fontWeight: 400,
                  fontSize: 11,
                  fontFamily: 'Inter',
                  borderColor: colors.mutedCyan[200],
                  borderWidth: 2,
                  borderStyle: 'solid',
                  padding: 5,
                  verticalAlign: 'middle',
                },
              }}
            />
          ) : null}
        </div>
      </ExpandablePanel>
    </div>
  );
}
