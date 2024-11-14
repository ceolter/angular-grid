export const modules = {
    groups: [
        {
            moduleName: 'ValidationModule',
            name: 'Validation (Dev Mode)',
        },
        {
            moduleName: 'SparklinesModule',
            name: 'Sparklines',
            isEnterprise: true,
        },
        {
            moduleName: 'IntegratedChartsModule',
            name: 'Integrated Charts',
            isEnterprise: true,
        },
        {
            name: 'Columns',
            children: [
                {
                    name: 'Column Sizing',
                    children: [
                        {
                            moduleName: 'ColumnAutoSizeModule',
                            name: 'Column Auto-Sizing',
                        },
                        {
                            moduleName: 'ColumnFlexModule',
                            name: 'Column Flex',
                        },
                    ],
                },
                {
                    moduleName: 'ColumnHoverModule',
                    name: 'Column Hover',
                },
            ],
        },
        {
            name: 'Rows',
            children: [
                {
                    moduleName: 'PinnedRowModule',
                    name: 'Row Pinning',
                },
                {
                    moduleName: 'RowAutoHeightModule',
                    name: 'Auto Row Height',
                },
                {
                    moduleName: 'RowStyleModule',
                    name: 'Styling Rows',
                },
                {
                    moduleName: 'PaginationModule',
                    name: 'Row Pagination',
                },
                {
                    moduleName: 'RowDragModule',
                    name: 'Row Dragging',
                },
            ],
        },
        {
            name: 'Cells',
            children: [
                {
                    name: 'Cell Content',
                    children: [
                        {
                            moduleName: 'CellRendererFunctionModule',
                            name: 'Cell Renderer Function',
                        },
                    ],
                },
                {
                    moduleName: 'CellStyleModule',
                    name: 'Styling Cells',
                },
                {
                    name: 'Highlighting Changes',
                    children: [
                        {
                            moduleName: 'AnimateShowChangeCellRendererModule',
                            name: 'Animate Show Change Cell Renderer',
                        },
                        {
                            moduleName: 'AnimateSlideCellRendererModule',
                            name: 'Animate Slide Cell Renderer',
                        },
                        {
                            moduleName: 'CellFlashModule',
                            name: 'Cell Flash',
                        },
                    ],
                },
                {
                    moduleName: 'TooltipModule',
                    name: 'Tooltips',
                },
                {
                    moduleName: 'ExpressionModule',
                    name: 'Expressions',
                },
            ],
        },
        {
            name: 'Filtering',
            children: [
                {
                    name: 'Column Filters',
                    children: [
                        {
                            moduleName: 'SimpleFilterModule',
                            name: 'Text Filter / Number Filter / Date Filter',
                        },
                        {
                            moduleName: 'SetFilterModule',
                            name: 'Set Filter',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'MultiFilterModule',
                            name: 'Multi Filter',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'CustomFilterModule',
                            name: 'Custom Column Filters',
                        },
                    ],
                },
                {
                    moduleName: 'AdvancedFilterModule',
                    name: 'Advanced Filter',
                    isEnterprise: true,
                },
                {
                    moduleName: 'ExternalFilterModule',
                    name: 'External Filter',
                },
                {
                    moduleName: 'QuickFilterModule',
                    name: 'Quick Filter',
                },
            ],
        },
        {
            name: 'Selection',
            children: [
                {
                    moduleName: 'RowSelectionModule',
                    name: 'Row Selection',
                },
                {
                    moduleName: 'CellSelectionModule',
                    name: 'Cell Selection',
                    isEnterprise: true,
                },
            ],
        },
        {
            name: 'Editing',
            children: [
                {
                    name: 'Provided Cell Editors',
                    children: [
                        {
                            moduleName: 'DefaultEditorModule',
                            name: 'Text Editor',
                        },
                        {
                            moduleName: 'LargeTextEditorModule',
                            name: 'Large Text Editor',
                        },
                        {
                            moduleName: 'SelectEditorModule',
                            name: 'Select Editor',
                        },
                        {
                            moduleName: 'RichSelectModule',
                            name: 'Rich Select Editor',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'DataTypeEditorsModule',
                            name: 'Number / Date / Checkbox Editors',
                        },
                    ],
                },
                {
                    moduleName: 'CustomEditorModule',
                    name: 'Custom Cell Editor Components',
                },
                {
                    moduleName: 'UndoRedoEditModule',
                    name: 'Undo / Redo Edits',
                },
                {
                    moduleName: 'FullRowEditModule',
                    name: 'Full Row Editing',
                },
            ],
        },
        {
            name: 'Interactivity',
            children: [
                {
                    moduleName: 'LocaleModule',
                    name: 'Localisation',
                },
            ],
        },
        {
            name: 'Row Grouping ',
            children: [
                {
                    moduleName: 'RowGroupingModule',
                    name: 'Row Grouping',
                    isEnterprise: true,
                },
                {
                    moduleName: 'RowGroupingPanelModule',
                    name: 'Row Grouping Panel',
                    isEnterprise: true,
                },
                {
                    moduleName: 'GroupFilterModule',
                    name: 'Group Filter',
                    isEnterprise: true,
                },
            ],
        },
        {
            name: 'Pivoting ',
            children: [
                {
                    moduleName: 'PivotModule',
                    name: 'Pivoting',
                    isEnterprise: true,
                },
            ],
        },
        {
            name: 'Tree Data ',
            children: [
                {
                    moduleName: 'TreeDataModule',
                    name: 'Tree Data',
                    isEnterprise: true,
                },
            ],
        },
        {
            name: 'Master Detail ',
            children: [
                {
                    moduleName: 'MasterDetailModule',
                    name: 'Master Detail',
                    isEnterprise: true,
                },
            ],
        },
        {
            name: 'Accessories',
            children: [
                {
                    name: 'Tool Panels',
                    isEnterprise: true,
                    children: [
                        {
                            moduleName: 'SideBarModule',
                            name: 'Side Bar',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'ColumnsToolPanelModule',
                            name: 'Columns Tool Panel',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'FiltersToolPanelModule',
                            name: 'Filters Tool Panel',
                            isEnterprise: true,
                        },
                    ],
                },
                {
                    moduleName: 'ColumnMenuModule',
                    name: 'Column Menu',
                    isEnterprise: true,
                },
                {
                    moduleName: 'ContextMenuModule',
                    name: 'Context Menu',
                    isEnterprise: true,
                },
                {
                    moduleName: 'StatusBarModule',
                    name: 'Status Bar',
                    isEnterprise: true,
                },
            ],
        },
        {
            name: 'Server-Side Data',
            children: [
                {
                    name: 'Server-Side Row Model',
                    isEnterprise: true,
                    children: [
                        {
                            moduleName: 'SkeletonCellRendererModule',
                            name: 'Skeleton Loading Component',
                            isEnterprise: true,
                        },
                    ],
                },
            ],
        },
        {
            name: 'Import & Export',
            children: [
                {
                    moduleName: 'CsvExportModule',
                    name: 'CSV Export',
                },

                {
                    moduleName: 'ExcelExportModule',
                    name: 'Excel Export',
                    isEnterprise: true,
                },
                {
                    moduleName: 'ClipboardModule',
                    name: 'Clipboard',
                    isEnterprise: true,
                },
                {
                    moduleName: 'NativeDragModule',
                    name: 'Drag & Drop',
                },
            ],
        },
        {
            name: 'Performance',
            children: [
                {
                    moduleName: 'ValueCacheModule',
                    name: 'Value Cache',
                },
            ],
        },
        {
            name: 'Other',
            children: [
                {
                    moduleName: 'AlignedGridsModule',
                    name: 'Aligned Grids',
                },
            ],
        },
        {
            name: 'API',
            children: [
                {
                    moduleName: 'StateModule',
                    name: 'Grid State',
                },
                {
                    moduleName: 'ColumnApiModule',
                    name: 'Column API',
                },
                {
                    moduleName: 'RowApiModule',
                    name: 'Row API',
                },
                {
                    moduleName: 'CellApiModule',
                    name: 'Cell API',
                },
                {
                    moduleName: 'ScrollApiModule',
                    name: 'Scrolling API',
                },
                {
                    moduleName: 'RenderApiModule',
                    name: 'Rendering API',
                },
                {
                    moduleName: 'GetColumnDefsApiModule',
                    name: 'Get Column Definitions API',
                },
                {
                    moduleName: 'EventApiModule',
                    name: 'Event API',
                },
                {
                    moduleName: 'ClientSideRowModelApiModule',
                    name: 'Client-Side Row Model API',
                },
                {
                    moduleName: 'ServerSideRowModelApiModule',
                    name: 'Server-Side Row Model API',
                    isEnterprise: true,
                },
            ],
        },
    ],
};
