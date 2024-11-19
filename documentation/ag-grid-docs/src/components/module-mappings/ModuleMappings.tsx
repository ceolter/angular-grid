import type { Framework } from '@ag-grid-types';
import type { ModuleMappings as ModuleMappingsType } from '@ag-grid-types';
import { Snippet } from '@ag-website-shared/components/snippet/Snippet';
import { type FunctionComponent, useCallback, useMemo, useRef, useState } from 'react';

import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, RowSelectionModule } from 'ag-grid-community';
import type {
    GetRowIdParams,
    IRowNode,
    RowSelectedEvent,
    RowSelectionOptions,
    ValueFormatterParams,
} from 'ag-grid-community';
import { ClipboardModule, ContextMenuModule, TreeDataModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import { type SelectedModules, getModuleMappingsSnippet } from './getModuleMappingsSnippet';

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
    const allCommunityRef = useRef(false);
    const allEnterpriseRef = useRef(false);

    const [defaultColDef] = useState({
        flex: 1,
    });
    const [columnDefs] = useState([{ field: 'moduleName' }]);
    const [autoGroupColumnDef] = useState({
        headerName: 'Feature',
        valueFormatter: (params: ValueFormatterParams) => `${params.value}${params.data.isEnterprise ? ' (e)' : ''}`,
    });
    const getRowId = useCallback((params: GetRowIdParams) => params.data.name, []);
    const [update, setUpdate] = useState(0);
    const [selectedModules, setSelectedModules] = useState<SelectedModules>({
        community: [],
        enterprise: [],
    });
    const selectedDependenciesSnippet = useMemo(() => getModuleMappingsSnippet(selectedModules), [selectedModules]);

    const onRowSelected = useCallback((event: RowSelectedEvent) => {
        const {
            node,
            data: { moduleName },
            api,
        } = event;
        const isSelected = !!node.isSelected();
        if (moduleName === 'AllEnterpriseModule') {
            allEnterpriseRef.current = isSelected;
            if (isSelected) {
                api.selectAll('all');
            } else {
                api.deselectAll('all');
            }
        } else if (moduleName === 'AllCommunityModule') {
            allCommunityRef.current = isSelected;
            const nodesToToggle: IRowNode[] = [];
            // toggle all community modules
            api.forEachLeafNode((child) => {
                if (!child.data.isEnterprise && child.data.moduleName) {
                    nodesToToggle.push(child);
                }
            });
            api.setNodesSelected({
                nodes: nodesToToggle,
                newValue: isSelected,
            });
        } else if (!moduleName && !isSelected && allCommunityRef.current) {
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
        setUpdate((old) => old + 1);
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
        setSelectedModules({
            community: allEnterpriseRef.current
                ? []
                : allCommunityRef.current
                  ? ['AllCommunityModule']
                  : selectedCommunity,
            enterprise: allEnterpriseRef.current ? ['AllEnterpriseModule'] : selectedEnterprise,
        });
    }, []);

    const rowSelection = useMemo<RowSelectionOptions>(() => {
        return {
            mode: 'multiRow',
            checkboxes: (params) => {
                if (allEnterpriseRef.current) {
                    return params.data.moduleName === 'AllEnterpriseModule';
                }
                if (!allCommunityRef.current) {
                    // neither is checked, so everything available
                    return true;
                }
                if (params.data.moduleName) {
                    // when all community is checked, only enterprise or all community (leaf modules) are available
                    return params.data.isEnterprise || params.data.moduleName === 'AllCommunityModule';
                }
                // when all community is checked, groups are available only if some of their children are enterprise
                return params.node.allLeafChildren?.some((child) => child.data.isEnterprise);
            },
            groupSelects: 'descendants',
            headerCheckbox: false,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [update]);

    return (
        <>
            <div style={{ height: '600px' }}>
                <AgGridReact
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    autoGroupColumnDef={autoGroupColumnDef}
                    rowData={modules.groups}
                    treeData
                    treeDataChildrenField={'children'}
                    getRowId={getRowId}
                    rowSelection={rowSelection}
                    onRowSelected={onRowSelected}
                    groupDefaultExpanded={-1}
                    loadThemeGoogleFonts
                />
            </div>
            {selectedDependenciesSnippet && (
                <Snippet framework={framework} content={selectedDependenciesSnippet} copyToClipboard />
            )}
        </>
    );
};
