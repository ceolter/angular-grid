const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const moduleCombinations1 = [
    [], // Always do this first to get a base size to enable selfSize calculation
    ['AlignedGridsModule'],
    ['AllCommunityEditorsModule'],
    ['AnimateShowChangeCellRendererModule'],
    ['AnimateSlideCellRendererModule'],
    ['AnimationFrameModule'],
    ['AriaModule'],
    ['AutoWidthModule'],
    ['CellApiModule'],
    ['CellFlashModule'],
    ['CellRendererFunctionModule'],
    ['CellStyleModule'],
    ['ChangeDetectionModule'],
    ['CheckboxCellRendererModule'],
    ['ClientSideRowModelApiModule'],
    ['ClientSideRowModelCoreModule'],
    ['ClientSideRowModelFilterModule'],
    ['ClientSideRowModelModule'],
    ['ClientSideRowModelSortModule'],
    ['ColumnAnimationModule'],
    ['ColumnApiModule'],
    ['ColumnAutosizeModule'],
    ['ColumnFilterMenuModule'],
    ['ColumnFilterModule'],
    ['ColumnFlexModule'],
    ['ColumnGroupHeaderCompModule'],
    ['ColumnGroupModule'],
    ['ColumnHeaderCompModule'],
    ['ColumnHoverModule'],
    ['ColumnMoveModule'],
    ['ColumnResizeModule'],
    ['CommunityCoreModule'],
    ['CommunityFeaturesModule'],
    ['CsrmSsrmSharedApiModule'],
    ['CsvExportModule'],
    ['DataTypeEditorsModule'],
    ['DataTypeModule'],
    ['DefaultEditorModule'],
    ['DragAndDropModule'],
    ['DragModule'],
    ['EditCoreModule'],
    ['EditModule'],
    ['EventApiModule'],
    ['ExpressionModule'],
    ['FilterCoreModule'],
    ['FilterModule'],
    ['FilterValueModule'],
    ['FloatingFilterCoreModule'],
    ['FloatingFilterModule'],
    ['FullRowEditModule'],
    ['GetColumnDefsApiModule'],
    ['HorizontalResizeModule'],
    ['InfiniteRowModelApiModule'],
    ['InfiniteRowModelCoreModule'],
    ['InfiniteRowModelModule'],
    ['KeyboardNavigationModule'],
    ['LargeTextEditorModule'],
    ['LoadingOverlayModule'],
    ['LocaleModule'],
    ['NativeDragModule'],
    ['NoRowsOverlayModule'],
    ['OverlayCoreModule'],
    ['OverlayModule'],
    ['PaginationModule'],
    ['PinnedColumnModule'],
    ['PinnedRowModule'],
    ['PopupModule'],
    ['QuickFilterModule'],
    ['ReadOnlyFloatingFilterModule'],
    ['RenderApiModule'],
    ['RowApiModule'],
    ['RowAutoHeightModule'],
    ['RowDragModule'],
    ['RowNodeBlockModule'],
    ['RowSelectionApiModule'],
    ['RowSelectionCoreModule'],
    ['RowSelectionModule'],
    ['RowStyleModule'],
    ['ScrollApiModule'],
    ['SelectEditorModule'],
    ['SelectionColumnModule'],
    ['SharedExportModule'],
    ['SharedMenuModule'],
    ['SimpleFilterModule'],
    ['SimpleFloatingFilterModule'],
    ['SortCoreModule'],
    ['SortIndicatorCompModule'],
    ['SortModule'],
    ['SsrmInfiniteSharedApiModule'],
    ['StateModule'],
    ['StickyRowModule'],
    ['TooltipCoreModule'],
    ['TooltipCompModule'],
    ['TooltipModule'],
    ['TouchModule'],
    ['UndoRedoEditModule'],
    ['ValidationModule'],
    ['ValueCacheModule'],
    // Add more combinations as needed
    // Enterprise
    ['AdvancedFilterModule'],
    ['AggregationModule'],
    ['CellSelectionCoreModule'],
    ['CellSelectionFillHandleModule'],
    ['CellSelectionModule'],
    ['CellSelectionRangeHandleModule'],
    ['ClientSideRowModelHierarchyModule'],
    ['ClipboardModule'],
    ['ColumnChooserModule'],
    ['ColumnMenuModule'],
    ['ColumnsToolPanelCoreModule'],
    ['ColumnsToolPanelModule'],
    ['ColumnsToolPanelRowGroupingModule'],
    ['ContextMenuModule'],
    ['EnterpriseCoreModule'],
    ['ExcelExportModule'],
    ['FiltersToolPanelModule'],
    ['GridChartsEnterpriseFeaturesModule'],
    ['GridChartsModule'],
    ['GroupCellRendererModule'],
    ['GroupColumnModule'],
    ['GroupFilterModule'],
    ['GroupFloatingFilterModule'],
    ['LoadingCellRendererModule'],
    ['MasterDetailCoreModule'],
    ['MasterDetailModule'],
    ['MenuCoreModule'],
    ['MenuItemModule'],
    ['MenuModule'],
    ['MultiFilterCoreModule'],
    ['MultiFilterModule'],
    ['MultiFloatingFilterModule'],
    ['PivotCoreModule'],
    ['PivotModule'],
    ['RangeSelectionModule'],
    ['RichSelectModule'],
    ['RowGroupingCoreModule'],
    ['RowGroupingModule'],
    ['RowGroupingOnlyModule'],
    ['RowGroupingPanelModule'],
    ['ServerSideRowModelApiModule'],
    ['ServerSideRowModelCoreModule'],
    ['ServerSideRowModelModule'],
    ['ServerSideRowModelRowGroupingModule'],
    ['ServerSideRowModelRowSelectionModule'],
    ['ServerSideRowModelSortModule'],
    ['SetFilterCoreModule'],
    ['SetFilterModule'],
    ['SetFloatingFilterModule'],
    ['SideBarModule'],
    // ['SideBarSharedModule'],
    ['SkeletonCellRendererModule'],
    ['SparklinesModule'],
    ['StatusBarCoreModule'],
    ['StatusBarModule'],
    ['StatusBarSelectionModule'],
    ['TreeDataCoreModule'],
    ['TreeDataModule'],
    ['ViewportRowModelCoreModule'],
    ['ViewportRowModelModule'],
];

const moduleCombinations = [[], ['ClientSideRowModelCoreModule'], ['IntegratedChartsModule']];

const results = [];
const updateModulesScript = path.join(__dirname, 'updateModules.cjs');
let baseSize = 0;

function runCombination(index) {
    if (index >= moduleCombinations.length) {
        // Save results to a JSON file
        fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
        console.log('Results saved to results.json');
        return;
    }

    const modules = moduleCombinations[index];
    const command = `node ${updateModulesScript} ${modules.join(' ')}`;

    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error running combination ${modules.join(', ')}:`, err);
            return;
        }

        console.log(stdout);
        console.error(stderr);

        // Extract file size and gzip size from the output
        const fileSizeMatch = stdout.match(/File size: (\d+\.\d+) kB/);
        const gzipSizeMatch = stdout.match(/gzip size: (\d+\.\d+) kB/);

        if (fileSizeMatch && gzipSizeMatch) {
            const fileSize = parseFloat(fileSizeMatch[1]);
            const gzipSize = parseFloat(gzipSizeMatch[1]);

            let selfSize = 0;
            if (modules.length === 0) {
                baseSize = fileSize;
                selfSize = fileSize;
            } else {
                selfSize = parseFloat((fileSize - baseSize).toFixed(2));
            }

            results.push({
                modules,
                selfSize,
                fileSize,
                gzipSize,
            });
        }

        // Run the next combination
        runCombination(index + 1);
    });
}

// Start running combinations
runCombination(0);
