import { Alert } from '@ag-website-shared/components/alert/Alert';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import DetailCellRenderer from '@components/grid/DetailCellRendererComponent';
import { Grid } from '@components/grid/Grid';
import ReleaseVersionNotes from '@components/release-notes/ReleaseVersionNotes.jsx';
import styles from '@pages-styles/pipelineChangelog.module.scss';
import { IssueColDef, IssueTypeColDef } from '@utils/grid/issueColDefs';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classnames from 'classnames';
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

const ALL_FIX_VERSIONS = 'All Versions';

function useFixVersion() {
    const [fixVersion, setFixVersion] = useState<string>(ALL_FIX_VERSIONS);

    useEffect(() => {
        const searchParams = window.location.search;
        const fixVersionParam = new URLSearchParams(searchParams).get('fixVersion');
        const version = searchParams && fixVersionParam ? fixVersionParam : undefined;
        setFixVersion(version!);
    }, []);

    return [fixVersion, setFixVersion];
}

function useSearchQuery() {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const handleSearchQueryChange = useCallback((event: ChangeEvent<{ value: string }>) => {
        const value = event.target?.value;
        setSearchQuery(value);
    }, []);

    useEffect(() => {
        const searchParams = window.location.search;
        const urlSearchQuery = new URLSearchParams(searchParams).get('searchQuery');
        const value = searchParams && urlSearchQuery ? urlSearchQuery : '';
        setSearchQuery(value);
    }, []);

    return {
        searchQuery,
        handleSearchQueryChange,
    };
}

export const Changelog = () => {
    const [rowData, setRowData] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const [versions, setVersions] = useState<string[]>([]);
    const [allReleaseNotes, setAllReleaseNotes] = useState(null);
    const [currentReleaseNotes, setCurrentReleaseNotes] = useState(null);
    const [markdownContent, setMarkdownContent] = useState(undefined);
    const [fixVersion, setFixVersion] = useFixVersion();
    const [hideExpander, setHideExpander] = useState(fixVersion === ALL_FIX_VERSIONS);
    const { searchQuery, handleSearchQueryChange } = useSearchQuery();
    const autoSizeStrategy = useMemo(() => ({ type: 'fitGridWidth' }), []);

    const applyFixVersionFilter = useCallback(() => {
        if (gridApi && fixVersion) {
            const newModel = fixVersion === ALL_FIX_VERSIONS ? null : { values: [fixVersion], filterType: 'set' };
            if (gridApi.getColumnFilterModel('version') === newModel) {
                return;
            }
            gridApi.setColumnFilterModel('version', newModel).then(() => {
                gridApi.onFilterChanged();
            });
        }
    }, [gridApi, fixVersion, versions]);

    useEffect(() => {
        fetch(urlWithBaseUrl('/changelog/changelog.json'))
            .then((response) => response.json())
            .then((data) => {
                const gridVersions = [ALL_FIX_VERSIONS, ...data.map((row) => row.versions[0])];
                const allVersions = Array.from(new Set<string>(gridVersions)).sort((v1, v2) => {
                    const [v1Major, v1Minor, v1Patch] = v1.split('.').map((num: string) => parseInt(num, 10));
                    const [v2Major, v2Minor, v2Patch] = v2.split('.').map((num: string) => parseInt(num, 10));

                    if (v1Major !== v2Major) {
                        return v2Major - v1Major;
                    } else if (v1Minor !== v2Minor) {
                        return v2Minor - v1Minor;
                    }

                    return v2Patch - v1Patch;
                });
                setVersions(allVersions);

                data.forEach((row) => {
                    // Only one version per row
                    row.version = row.versions[0];
                });
                setRowData(data);
            });
        fetch(urlWithBaseUrl('/changelog/releaseVersionNotes.json'))
            .then((response) => response.json())
            .then((data) => {
                setAllReleaseNotes(data);
            });
    }, []);

    useEffect(() => {
        applyFixVersionFilter();
    }, [fixVersion]);

    useEffect(() => {
        let releaseNotesVersion = fixVersion;
        if (!releaseNotesVersion) {
            // Find the latest release notes version
            releaseNotesVersion = allReleaseNotes?.find((element) => !!element['release version'])?.['release version'];
        }

        if (releaseNotesVersion && allReleaseNotes) {
            const releaseNotes = allReleaseNotes.find((element) =>
                element['release version'].includes(releaseNotesVersion)
            );

            let currentReleaseNotesHtml = null;
            let newHideExpander = hideExpander;
            if (releaseNotes) {
                newHideExpander = !releaseNotes['showExpandLink'] && releaseNotes['markdown'];

                if (releaseNotes['markdown']) {
                    fetch(urlWithBaseUrl(`/changelog/${releaseNotes['markdown']}`))
                        .then((response) => response.text())
                        .then((markdownContent) => {
                            setMarkdownContent(markdownContent);
                        })
                        .catch((error) => {
                            // eslint-disable-next-line no-console
                            console.error('Error fetching Markdown content:', error);
                        });
                } else {
                    currentReleaseNotesHtml = Object.keys(releaseNotes)
                        .map((element) => releaseNotes[element])
                        .join(' ');
                    setMarkdownContent(undefined);
                }
            } else {
                newHideExpander = true;
            }

            setHideExpander(newHideExpander);
            setCurrentReleaseNotes(currentReleaseNotesHtml);
        }
    }, [fixVersion, allReleaseNotes]);

    const gridReady = useCallback(
        (params) => {
            setGridApi(params.api);
        },
        [searchQuery]
    );

    useEffect(() => {
        if (!gridApi) {
            return;
        }

        gridApi.setGridOption('quickFilterText', searchQuery);
    }, [gridApi, searchQuery]);

    const isRowMaster = useCallback((params) => {
        return params.moreInformation || params.deprecationNotes || params.breakingChangesNotes;
    }, []);

    const switchDisplayedFixVersion = useCallback(
        (fixVersion) => {
            setFixVersion(fixVersion);
            const url = new URL(window.location.href);

            // Remove trailing slash when adding search params (SEO)
            if (url.pathname.endsWith('/')) {
                url.pathname = url.pathname.slice(0, -1);
            }

            url.searchParams.set('fixVersion', fixVersion);
            window.history.replaceState({}, '', url);
        },
        [setFixVersion]
    );

    const defaultColDef = useMemo(
        () => ({
            cellClass: styles.fontClass,
            headerClass: styles.fontClass,
            autoHeaderHeight: true,
            wrapHeaderText: true,
            suppressHeaderMenuButton: true,
            filter: true,
            floatingFilter: true,
            suppressKeyboardEvent: (params) => {
                if (params.event.key === 'Enter' && params.node.master && params.event.type === 'keydown') {
                    params.api.getCellRendererInstances({ rowNodes: [params.node] })[0].clickHandlerFunc();
                    return true;
                }
                return false;
            },
            cellDataType: false,
        }),
        []
    );

    const detailCellRendererParams = useCallback((params) => {
        function produceHTML(fieldName, fieldInfo) {
            return fieldName !== 'Link to Documentation'
                ? `<strong>${fieldName}:</strong><br> ${fieldInfo}<br><br>`
                : `<strong>${fieldName}:</strong><br> ${fieldInfo}`;
        }

        const moreInfo = params.data.moreInformation
            ? produceHTML('More Information', params.data.moreInformation)
            : '';
        const deprecationNotes = params.data.deprecationNotes
            ? produceHTML('Deprecation Notes', params.data.deprecationNotes)
            : '';
        const breakingChangesNotes = params.data.breakingChangesNotes
            ? produceHTML('Breaking Changes', params.data.breakingChangesNotes)
            : '';
        const linkToDocumentation = params.data.documentationUrl
            ? produceHTML('Link to Documentation', params.data.documentationUrl)
            : '';

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

        const message = makeLinksFunctional(
            (moreInfo + deprecationNotes + breakingChangesNotes + linkToDocumentation)
                .replaceAll('\n\r', '<br>')
                .replaceAll('\n', '<br>')
                .replaceAll('\r', '<br>')
        );
        return {
            message: message,
        };
    }, []);

    const COLUMN_DEFS = useMemo(
        () => [
            IssueColDef,
            {
                field: 'summary',
                tooltipField: 'summary',
                width: 300,
                minWidth: 200,
                flex: 1,
                filter: 'agTextColumnFilter',
            },
            {
                field: 'version',
                headerName: 'Version',
                filter: 'agSetColumnFilter',
                width: 145,
                sort: 'desc',
            },
            IssueTypeColDef,
            {
                field: 'status',
                valueGetter: (params) => {
                    return params.data.resolution;
                },
                width: 110,
                resizable: false,
            },
        ],
        []
    );

    return (
        <div className={classnames('page-margin', styles.container)}>
            <h1>AG Grid Changelog</h1>

            <section className={styles.header}>
                <Alert type="idea">
                    This changelog enables you to identify the specific version in which a feature request or bug fix
                    was included. Check out the <a href="../pipeline/">Pipeline</a> to see what's in our product
                    backlog.
                </Alert>

                <ReleaseVersionNotes
                    releaseNotes={fixVersion === ALL_FIX_VERSIONS ? undefined : currentReleaseNotes}
                    markdownContent={fixVersion === ALL_FIX_VERSIONS ? undefined : markdownContent}
                    versions={versions}
                    fixVersion={fixVersion}
                    onChange={switchDisplayedFixVersion}
                    hideExpander={hideExpander}
                />
            </section>

            <div className={styles.searchBarOuter}>
                <Icon name="search" />
                <input
                    type="search"
                    className={styles.searchBar}
                    placeholder={'Search changelog...'}
                    value={searchQuery}
                    onChange={handleSearchQueryChange}
                ></input>
                <span className={classnames(styles.searchExplainer, 'text-secondary')}>
                    Find changelog items by issue number, summary content, or version
                </span>
            </div>

            <Grid
                gridHeight={'70.5vh'}
                columnDefs={COLUMN_DEFS}
                rowData={rowData}
                defaultColDef={defaultColDef}
                detailRowAutoHeight={true}
                enableCellTextSelection={true}
                loadThemeGoogleFonts={true}
                detailCellRendererParams={detailCellRendererParams}
                detailCellRenderer={DetailCellRenderer}
                isRowMaster={isRowMaster}
                masterDetail
                autoSizeStrategy={autoSizeStrategy}
                onGridReady={gridReady}
                onFirstDataRendered={() => {
                    applyFixVersionFilter();
                }}
            ></Grid>
        </div>
    );
};
