import { Bean, BeanStub } from "@ag-grid-community/core";

@Bean("chartTranslationService")
export class ChartTranslationService extends BeanStub {

    private static DEFAULT_TRANSLATIONS: { [name: string]: string; } = {
        pivotChartTitle: 'Pivot Chart',
        rangeChartTitle: 'Range Chart',
        settings: 'Settings',
        data: 'Data',
        format: 'Format',
        categories: 'Categories',
        defaultCategory: '(None)',
        series: 'Series',
        xyValues: 'X Y Values',
        paired: 'Paired Mode',
        axis: 'Axis',
        radiusAxis: 'Radius Axis',
        navigator: 'Navigator',
        color: 'Color',
        thickness: 'Thickness',
        xType: 'X Type',
        automatic: 'Automatic',
        category: 'Category',
        number: 'Number',
        time: 'Time',
        autoRotate: 'Auto Rotate',
        xRotation: 'X Rotation',
        yRotation: 'Y Rotation',
        labelRotation: 'Rotation',
        circle: 'Circle',
        orientation: 'Orientation',
        polygon: 'Polygon',
        fixed: 'Fixed',
        parallel: 'Parallel',
        perpendicular: 'Perpendicular',
        radiusAxisPosition: 'Position',
        ticks: 'Ticks',
        width: 'Width',
        height: 'Height',
        length: 'Length',
        padding: 'Padding',
        spacing: 'Spacing',
        chart: 'Chart',
        title: 'Title',
        titlePlaceholder: 'Chart title - double click to edit',
        background: 'Background',
        font: 'Font',
        top: 'Top',
        right: 'Right',
        bottom: 'Bottom',
        left: 'Left',
        labels: 'Labels',
        calloutLabels: 'Callout Labels',
        sectorLabels: 'Sector Labels',
        positionRatio: 'Position Ratio',
        size: 'Size',
        shape: 'Shape',
        minSize: 'Minimum Size',
        maxSize: 'Maximum Size',
        legend: 'Legend',
        position: 'Position',
        markerSize: 'Marker Size',
        markerStroke: 'Marker Stroke',
        markerPadding: 'Marker Padding',
        itemSpacing: 'Item Spacing',
        itemPaddingX: 'Item Padding X',
        itemPaddingY: 'Item Padding Y',
        layoutHorizontalSpacing: 'Horizontal Spacing',
        layoutVerticalSpacing: 'Vertical Spacing',
        strokeWidth: 'Stroke Width',
        offset: 'Offset',
        offsets: 'Offsets',
        tooltips: 'Tooltips',
        callout: 'Callout',
        markers: 'Markers',
        shadow: 'Shadow',
        blur: 'Blur',
        xOffset: 'X Offset',
        yOffset: 'Y Offset',
        lineWidth: 'Line Width',
        lineDash: 'Line Dash',
        lineDashOffset: 'Dash Offset',
        normal: 'Normal',
        bold: 'Bold',
        italic: 'Italic',
        boldItalic: 'Bold Italic',
        predefined: 'Predefined',
        fillOpacity: 'Fill Opacity',
        strokeOpacity: 'Line Opacity',
        histogramBinCount: 'Bin count',
        connectorLine: 'Connector Line',
        seriesItems: 'Series Items',
        seriesItemType: 'Item Type',
        seriesItemPositive: 'Positive',
        seriesItemNegative: 'Negative',
        seriesItemLabels: 'Item Labels',
        columnGroup: 'Column',
        barGroup: 'Bar',
        pieGroup: 'Pie',
        lineGroup: 'Line',
        scatterGroup: 'X Y (Scatter)',
        areaGroup: 'Area',
        polarGroup: 'Polar',
        statisticalGroup: 'Statistical',
        hierarchicalGroup: 'Hierarchical',
        specializedGroup: 'Specialized',
        combinationGroup: 'Combination',
        groupedColumnTooltip: 'Grouped',
        stackedColumnTooltip: 'Stacked',
        normalizedColumnTooltip: '100% Stacked',
        groupedBarTooltip: 'Grouped',
        stackedBarTooltip: 'Stacked',
        normalizedBarTooltip: '100% Stacked',
        pieTooltip: 'Pie',
        doughnutTooltip: 'Doughnut',
        lineTooltip: 'Line',
        groupedAreaTooltip: 'Area',
        stackedAreaTooltip: 'Stacked',
        normalizedAreaTooltip: '100% Stacked',
        scatterTooltip: 'Scatter',
        bubbleTooltip: 'Bubble',
        histogramTooltip: 'Histogram',
        radialColumnTooltip: 'Radial Column',
        radialBarTooltip: 'Radial Bar',
        radarLineTooltip: 'Radar Line',
        radarAreaTooltip: 'Radar Area',
        nightingaleTooltip: 'Nightingale',
        rangeBarTooltip: 'Range Bar',
        rangeAreaTooltip: 'Range Area',
        boxPlotTooltip: 'Box Plot',
        treemapTooltip: 'Treemap',
        waterfallTooltip: 'Waterfall',
        columnLineComboTooltip: 'Column & Line',
        areaColumnComboTooltip: 'Area & Column',
        customComboTooltip: 'Custom Combination',
        innerRadius: 'Inner Radius',
        startAngle: 'Start Angle',
        endAngle: 'End Angle',
        groupPadding: 'Group Padding',
        seriesPadding: 'Series Padding',
        whisker: 'Whisker',
        cap: 'Cap',
        capLengthRatio: 'Length Ratio',
        labelPlacement: 'Placement',
        inside: 'Inside',
        outside: 'Outside',
        noDataToChart: 'No data available to be charted.',
        pivotChartRequiresPivotMode: 'Pivot Chart requires Pivot Mode enabled.',
        chartSettingsToolbarTooltip: 'Menu',
        chartLinkToolbarTooltip: 'Linked to Grid',
        chartUnlinkToolbarTooltip: 'Unlinked from Grid',
        chartDownloadToolbarTooltip: 'Download Chart',
        histogramFrequency: "Frequency",
        seriesChartType: 'Series Chart Type',
        seriesType: 'Series Type',
        secondaryAxis: 'Secondary Axis',
    };

    public translate(toTranslate: string, defaultText?: string): string {
        const translate = this.localeService.getLocaleTextFunc();
        const defaultTranslation = ChartTranslationService.DEFAULT_TRANSLATIONS[toTranslate] || defaultText;
        return translate(toTranslate, defaultTranslation as string);
    }
}
