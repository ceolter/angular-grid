import { Alert } from '@ag-website-shared/components/alert/Alert';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import DetailCellRenderer from '@components/grid/DetailCellRendererComponent';
import { Grid } from '@components/grid/Grid';
import styles from '@pages-styles/pipelineChangelog.module.scss';
import { IssueColDef, IssueTypeColDef } from '@utils/grid/issueColDefs';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classnames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const COLUMN_DEFS = [
    IssueColDef,
    {
        field: 'summary',
        tooltipField: 'summary',
        width: 300,
        minWidth: 200,
        flex: 1,
        filter: 'agTextColumnFilter',
    },
    IssueTypeColDef,
    {
        field: 'status',
        width: 135,
        valueGetter: (params) => {
            const fixVersionsArr = params.data.versions;
            const hasFixVersion = fixVersionsArr.length > 0;
            if (hasFixVersion) {
                const latestFixVersion = fixVersionsArr.length - 1;
                const fixVersion = fixVersionsArr[latestFixVersion];
                if (fixVersion === 'Next' && (params.data.status === 'Backlog' || params.data.status === 'Done')) {
                    return 'Next Release';
                }
            }
            if (params.data.status === 'Done' && params.data.resolution !== 'Done') {
                return params.data.resolution;
            }

            if (params.data.status !== 'Done' && params.data.status !== 'Backlog') {
                return 'Scheduled';
            } else {
                return 'Backlog';
            }
        },
    },
];

const defaultColDef = {
    autoHeight: true,
    filter: true,
    cellClass: styles.fontClass,
    headerClass: styles.fontClass,
    suppressKeyboardEvent: (params) => {
        if (params.event.key === 'Enter' && params.node.master && params.event.type === 'keydown') {
            params.api.getCellRendererInstances({ rowNodes: [params.node] })[0].clickHandlerFunc();
            return true;
        }
        return false;
    },
    cellDataType: false,
};

const isRowMaster = (row) => row.moreInformation || row.deprecationNotes || row.breakingChangesNotes;

const newLinesToBreaks = (message) =>
    message.replaceAll('\n\r', '<br>').replaceAll('\n', '<br>').replaceAll('\r', '<br>');

const detailCellRendererParams = (params) => {
    const combinedMessages = [
        params.data.moreInformation,
        params.data.deprecationNotes,
        params.data.breakingChangesNotes,
    ]
        .filter(Boolean)
        .join('\n\n');
    let message = newLinesToBreaks(combinedMessages);

    function makeLinksFunctional(message) {
        let msgArr = message.split(' ');
        const linkStrIdx = msgArr.findIndex((word) => word.includes('https://'));
        if (linkStrIdx > 0) {
            msgArr = msgArr.map((element) => {
                if (element.includes('https://')) {
                    const beginningIndex = element.indexOf('http');
                    const endIndex = element.indexOf('<', beginningIndex);
                    const isEndIndex = endIndex >= 0;
                    let length = 0;
                    if (isEndIndex) {
                        length = endIndex - beginningIndex;
                    }

                    const httpIdx = element.indexOf('http');
                    const link = length ? element.substring(httpIdx, httpIdx + length) : element.substring(httpIdx);
                    const htmlLink = isEndIndex
                        ? `<a class=${styles.link} href="${link}"
          target="_blank">${link}</a>${element.substring(endIndex)}`
                        : `<a class=${styles.link} target="_blank" href="${link}">${link}</a>`;
                    return element.substring(0, beginningIndex) + htmlLink;
                }
                return element;
            });
            message = msgArr.join(' ');
        }
        return message;
    }

    message = makeLinksFunctional(message);
    const res = {};
    res.message = message;

    return res;
};

const extractFilterTerm = (location) =>
    location && location.search ? new URLSearchParams(location.search).get('searchQuery') : '';

export const Pipeline = ({ location }) => {
    const [rowData, setRowData] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const URLFilterSearchQuery = useState(extractFilterTerm(location))[0];
    const searchBarEl = useRef(null);

    useEffect(() => {
        fetch(urlWithBaseUrl('/pipeline/pipeline.json'))
            .then((response) => response.json())
            .then((data) => {
                setRowData(data);
            });
    }, []);

    const gridReady = (params) => {
        setGridApi(params.api);
        params.api.setGridOption('quickFilterText', URLFilterSearchQuery);
    };

    const onQuickFilterChange = useCallback(
        (event) => {
            gridApi.setGridOption('quickFilterText', event.target.value);
        },
        [gridApi]
    );

    return (
        <div className={classnames('page-margin', styles.container)}>
            <h1>AG Grid Pipeline</h1>
            <section className={styles.header}>
                <Alert type="idea">
                    <p>
                        The AG Grid pipeline lists the feature requests and active bugs in our product backlog. Use it
                        to see the items scheduled for our next release or to look up the status of a specific item. If
                        you can't find the item you're looking for, check the{' '}
                        <a href={urlWithBaseUrl('/changelog')}>Changelog</a> containing the list of completed items.
                    </p>
                </Alert>
            </section>

            <div className={styles.searchBarOuter}>
                <Icon name="search" />
                <input
                    type="search"
                    className={styles.searchBar}
                    placeholder={'Search pipeline...'}
                    ref={searchBarEl}
                    onChange={onQuickFilterChange}
                ></input>
                <span className={classnames(styles.searchExplainer, 'text-secondary')}>
                    Find pipeline items by issue number, summary content
                </span>
            </div>

            <Grid
                gridHeight={'78vh'}
                columnDefs={COLUMN_DEFS}
                isRowMaster={isRowMaster}
                detailRowAutoHeight={true}
                defaultColDef={defaultColDef}
                enableCellTextSelection={true}
                detailCellRendererParams={detailCellRendererParams}
                detailCellRenderer={DetailCellRenderer}
                masterDetail={true}
                loadThemeGoogleFonts={true}
                rowData={rowData}
                onGridReady={gridReady}
            ></Grid>
        </div>
    );
};
