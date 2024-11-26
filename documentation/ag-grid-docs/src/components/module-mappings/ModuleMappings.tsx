import type { Framework } from '@ag-grid-types';
import type { ModuleMappings as ModuleMappingsType } from '@ag-grid-types';
import { Snippet } from '@ag-website-shared/components/snippet/Snippet';
import { type FunctionComponent, useCallback, useMemo, useRef, useState } from 'react';

import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, RowSelectionModule } from 'ag-grid-community';
import type { ColDef, GetRowIdParams, IRowNode, RowSelectedEvent, RowSelectionOptions } from 'ag-grid-community';
import { ClipboardModule, ContextMenuModule, TreeDataModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import { ModuleCellRenderer } from './ModuleCellRenderer';
import { ModuleConfiguration } from './ModuleConfiguration';
import styles from './ModuleMappings.module.scss';
import { ModuleNameCellRenderer } from './ModuleNameCellRenderer';
import { ModuleSearch } from './ModuleSearch';
import { useModuleConfig } from './useModuleConfig';

interface Props {
    framework: Framework;
    modules: ModuleMappingsType;
}

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    TreeDataModule,
    RowSelectionModule,
    ContextMenuModule,
    ClipboardModule,
]);

export const ModuleMappings: FunctionComponent<Props> = ({ framework, modules }) => {
    const gridRef = useRef<AgGridReact>(null);
    const moduleConfig = useModuleConfig(gridRef);
    const { selectedDependenciesSnippet, setSelectedModules, bundleOption } = moduleConfig;

    const [defaultColDef] = useState<ColDef>({
        flex: 1,
        sortable: false,
        resizable: false,
        suppressMovable: true,
    });
    const [columnDefs] = useState([
        {
            field: 'moduleName',
            cellRenderer: ModuleNameCellRenderer,
        },
    ]);
    const [autoGroupColumnDef] = useState({
        headerName: 'Feature',
        cellRendererParams: {
            innerRenderer: ModuleCellRenderer,
        },
    });
    const getRowId = useCallback(
        (params: GetRowIdParams) => (params.data.children ? `${params.data.name} group` : params.data.moduleName),
        []
    );

    const onRowSelected = useCallback(
        (event: RowSelectedEvent) => {
            // All disabled, so nothing to select
            if (bundleOption === 'AllEnterpriseModule') {
                return;
            }

            const {
                node,
                data: { moduleName },
                api,
            } = event;
            const isSelected = !!node.isSelected();
            if (!moduleName && !isSelected && bundleOption === 'AllCommunityModule') {
                // when deselecting a group with all community selected, we need to prevent deselecting disabled children
                const nodesToReselect: IRowNode[] = [];
                node.allLeafChildren?.forEach((child) => {
                    if (!child.isSelected() && !child.data.isEnterprise) {
                        nodesToReselect.push(child);
                    }
                    api.setNodesSelected({
                        nodes: nodesToReselect,
                        newValue: true,
                    });
                });
            }

            const selectedCommunity: string[] = [];
            const selectedEnterprise: string[] = [];
            api.forEachLeafNode((leaf) => {
                const { moduleName: leafModuleName, isEnterprise: leafIsEnterprise } = leaf.data;
                if (leafModuleName && leaf.isSelected()) {
                    if (leafIsEnterprise) {
                        selectedEnterprise.push(leafModuleName);
                    } else {
                        selectedCommunity.push(leafModuleName);
                    }
                }
            });

            setSelectedModules((curSelectedModules) => {
                let community = selectedCommunity;

                if (bundleOption === 'AllCommunityModule') {
                    const communitySet = new Set(curSelectedModules.community);
                    communitySet.add('AllCommunityModule');
                    community = Array.from(communitySet);
                }

                return {
                    community,
                    enterprise: selectedEnterprise,
                };
            });
        },
        [bundleOption, setSelectedModules]
    );

    const rowSelection = useMemo<RowSelectionOptions>(() => {
        return {
            mode: 'multiRow',
            checkboxes: (params) => {
                if (bundleOption === '') {
                    // No bundles are checked, so everything available
                    return true;
                } else if (bundleOption === 'AllCommunityModule') {
                    // All community is checked, only enterprise values are available
                    return params.node.allLeafChildren?.length
                        ? params.node.allLeafChildren.some((child) => child.data.isEnterprise)
                        : params.data.isEnterprise;
                }

                // All enterprise is checked, none are available
                return false;
            },
            groupSelects: 'descendants',
            headerCheckbox: bundleOption === '',
        };
    }, [bundleOption]);

    return (
        <div className={styles.container}>
            <ModuleConfiguration moduleConfig={moduleConfig} />
            <ModuleSearch gridRef={gridRef} />
            <div style={{ height: '410px' }}>
                <AgGridReact
                    ref={gridRef}
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    autoGroupColumnDef={autoGroupColumnDef}
                    rowData={modules.groups}
                    treeData
                    treeDataChildrenField={'children'}
                    getRowId={getRowId}
                    rowSelection={rowSelection}
                    onRowSelected={onRowSelected}
                    loadThemeGoogleFonts
                    suppressContextMenu
                />
            </div>
            {selectedDependenciesSnippet && (
                <div className={styles.moduleSnippet}>
                    <Snippet framework={framework} content={selectedDependenciesSnippet} copyToClipboard />
                </div>
            )}
        </div>
    );
};
