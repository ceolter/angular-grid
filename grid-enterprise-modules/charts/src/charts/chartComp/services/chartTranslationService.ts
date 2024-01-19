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
        labelRotation: 'Label Rotation',
        circle: 'Circle',
        orientation: 'Orientation',
        polygon: 'Polygon',
        fixed: 'Fixed',
        parallel: 'Parallel',
        perpendicular: 'Perpendicular',
        radiusAxisPosition: 'Radius Axis Position',
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
        normal: 'Normal',
        bold: 'Bold',
        italic: 'Italic',
        boldItalic: 'Bold Italic',
        predefined: 'Predefined',
        fillOpacity: 'Fill Opacity',
        strokeOpacity: 'Line Opacity',
        histogramBinCount: 'Bin count',
        columnGroup: 'Column',
        barGroup: 'Bar',
        pieGroup: 'Pie',
        lineGroup: 'Line',
        scatterGroup: 'X Y (Scatter)',
        areaGroup: 'Area',
        histogramGroup: 'Histogram',
        polarGroup: 'Polar',
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
        radarLineTooltip: 'Radar Line',
        radarAreaTooltip: 'Radar Area',
        nightingaleTooltip: 'Nightingale',
        boxPlotTooltip: 'Box Plot',
        columnLineComboTooltip: 'Column & Line',
        areaColumnComboTooltip: 'Area & Column',
        customComboTooltip: 'Custom Combination',
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
