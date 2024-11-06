import ApiIcon from '@ag-website-shared/images/inline-svgs/api.svg?react';
import BoldChevronDown from '@ag-website-shared/images/inline-svgs/bold-chevron-down.svg?react';
import BoldChevronLeft from '@ag-website-shared/images/inline-svgs/bold-chevron-left.svg?react';
import BoldChevronRight from '@ag-website-shared/images/inline-svgs/bold-chevron-right.svg?react';
import BoldChevronUp from '@ag-website-shared/images/inline-svgs/bold-chevron-up.svg?react';
import Chord from '@ag-website-shared/images/inline-svgs/chord.svg?react';
import CodeResult from '@ag-website-shared/images/inline-svgs/code-result.svg?react';
import CodeSandboxIcon from '@ag-website-shared/images/inline-svgs/codesandbox.svg?react';
import ColumnsIcon from '@ag-website-shared/images/inline-svgs/columns.svg?react';
import ConeFunnel from '@ag-website-shared/images/inline-svgs/cone-funnel.svg?react';
import CrossIcon from '@ag-website-shared/images/inline-svgs/cross.svg?react';
import EnterpriseIcon from '@ag-website-shared/images/inline-svgs/enterprise.svg?react';
import EscapeIcon from '@ag-website-shared/images/inline-svgs/escape.svg?react';
import FigmaIcon from '@ag-website-shared/images/inline-svgs/figma-logo.svg?react';
import Funnel from '@ag-website-shared/images/inline-svgs/funnel.svg?react';
import HeadingResult from '@ag-website-shared/images/inline-svgs/heading-result.svg?react';
import IntegratedChartsIcon from '@ag-website-shared/images/inline-svgs/integrated-chart.svg?react';
import maximizeIcon from '@ag-website-shared/images/inline-svgs/maximize.svg?react';
import minimizeIcon from '@ag-website-shared/images/inline-svgs/minimize.svg?react';
import NewTabIcon from '@ag-website-shared/images/inline-svgs/new-tab.svg?react';
import PageResult from '@ag-website-shared/images/inline-svgs/page-result.svg?react';
import PlunkerIcon from '@ag-website-shared/images/inline-svgs/plunker.svg?react';
import Pyramid from '@ag-website-shared/images/inline-svgs/pyramid.svg?react';
import RadarArea from '@ag-website-shared/images/inline-svgs/radar-area.svg?react';
import RadialColumn from '@ag-website-shared/images/inline-svgs/radial-column.svg?react';
import RadialGauge from '@ag-website-shared/images/inline-svgs/radial-gauge.svg?react';
import ReplayDemoIcon from '@ag-website-shared/images/inline-svgs/replay-demo-icon.svg?react';
import RowsIcon from '@ag-website-shared/images/inline-svgs/rows.svg?react';
import Sankey from '@ag-website-shared/images/inline-svgs/sankey.svg?react';
import StackBlitzIcon from '@ag-website-shared/images/inline-svgs/stack-blitz.svg?react';
import StackOverflowMonochromeIcon from '@ag-website-shared/images/inline-svgs/stack-overflow-monochrome.svg?react';
import StackOverflowIcon from '@ag-website-shared/images/inline-svgs/stack-overflow.svg?react';
import TakeControlIcon from '@ag-website-shared/images/inline-svgs/take-control-icon.svg?react';
import TickIcon from '@ag-website-shared/images/inline-svgs/tick.svg?react';
import XLogoIcon from '@ag-website-shared/images/inline-svgs/x-logo.svg?react';
import ZendeskMonochromeIcon from '@ag-website-shared/images/inline-svgs/zendesk-monochrome.svg?react';
import ZendeskIcon from '@ag-website-shared/images/inline-svgs/zendesk.svg?react';
import * as CarbonIcon from '@carbon/icons-react';
import classNames from 'classnames';

import styles from './Icon.module.scss';

// Uses IBM Carbon Design System icons as a base
// Full list of Carbon icons => https://carbondesignsystem.com/guidelines/icons/library

const SOCIALS_ICON_MAP = {
    github: CarbonIcon.LogoGithub,
    twitter: CarbonIcon.LogoTwitter,
    xLogo: XLogoIcon,
    youtube: CarbonIcon.LogoYoutube,
    linkedin: CarbonIcon.LogoLinkedin,
    email: CarbonIcon.Email,
    blog: CarbonIcon.Blog,
    stackoverflow: StackOverflowIcon,
    stackoverflowMonochrome: StackOverflowMonochromeIcon,
    zendesk: ZendeskIcon,
    zendeskMonochrome: ZendeskMonochromeIcon,
};

const DOCS_CATEGORIES_ICON_MAP = {
    'docs-api': ApiIcon,
    'docs-columns': ColumnsIcon,
    'docs-row': RowsIcon,
    'docs-tooling': CarbonIcon.ToolKit,
    'docs-styling': CarbonIcon.ColorPalette,
    'docs-csd': CarbonIcon.Gui,
    'docs-ssd': CarbonIcon.Db2Database,
    'docs-selection': CarbonIcon.CheckboxChecked,
    'docs-filtering': CarbonIcon.Filter,
    'docs-rendering': CarbonIcon.DataVis_4,
    'docs-editing': CarbonIcon.WatsonHealthTextAnnotationToggle,
    'docs-group': CarbonIcon.CrossTab,
    'docs-detail': CarbonIcon.ShrinkScreen,
    'docs-import-export': CarbonIcon.Launch,
    'docs-accessories': CarbonIcon.ListDropdown,
    'docs-components': CarbonIcon.Settings,
    'docs-sparklines': CarbonIcon.Growth,
    'docs-integrated-charts': IntegratedChartsIcon,
    'docs-standalone-charts': CarbonIcon.SkillLevel,
    'docs-scrolling': CarbonIcon.FitToHeight,
    'docs-interactivity': CarbonIcon.TouchInteraction,
    'docs-testing': CarbonIcon.Task,
    'docs-misc': CarbonIcon.IbmCloudEventNotification,
};

const HOMEPAGE_FEATURES_ICON_MAP = {
    'feature-editing': CarbonIcon.WatsonHealthTextAnnotationToggle,
    'feature-transactions': CarbonIcon.DataShare,
    'feature-aggregation': CarbonIcon.Sigma,
    'feature-grouping': CarbonIcon.Table,
    'feature-detail': CarbonIcon.ShrinkScreen,
    'feature-clipboard': CarbonIcon.Report,
    'feature-server-side': CarbonIcon.Db2Database,
    'feature-pivoting': CarbonIcon.CrossTab,
    'feature-filtering': CarbonIcon.Filter,
    'feature-excel': CarbonIcon.DocumentExport,
    'feature-menu': CarbonIcon.ListDropdown,
    'feature-tree': CarbonIcon.TreeViewAlt,
};

const CHARTS_ICON_MAP = {
    chartsBar: CarbonIcon.ChartBar,
    chartsColumn: CarbonIcon.ChartColumn,
    chartsLine: CarbonIcon.ChartLine,
    chartsArea: CarbonIcon.ChartArea,
    chartsScatter: CarbonIcon.ChartScatter,
    chartsBubble: CarbonIcon.ChartBubble,
    chartsPie: CarbonIcon.ChartPie,
    chartsDonut: CarbonIcon.ChartRing,
    chartsCombination: CarbonIcon.ChartCombo,
    chartsHistogram: CarbonIcon.Ordinal,
    chartsHeatmap: CarbonIcon.HeatMap_03,
    chartsRangeArea: CarbonIcon.ChartRiver,
    chartsRangeBar: CarbonIcon.ChartBarFloating,
    chartsBoxPlot: CarbonIcon.BoxPlot,
    chartsErrorBar: CarbonIcon.ChartErrorBar,
    chartsWaterfall: CarbonIcon.ChartWaterfall,
    chartsRadar: CarbonIcon.ChartRadar,
    chartsRadarArea: RadarArea,
    chartsRadialGauge: RadialGauge,
    chartsSankey: Sankey,
    chartsChord: Chord,
    chartsNightingale: CarbonIcon.ChartRose,
    chartsRadialColumn: RadialColumn,
    chartsRadialBar: CarbonIcon.ChartRadial,
    chartsTreemap: CarbonIcon.ChartTreemap,
    chartsSunburst: CarbonIcon.ChartSunburst,
    chartsIcicle: CarbonIcon.ChartClusterBar,
    chartsFunnel: Funnel,
    chartsConeFunnel: ConeFunnel,
    chartsPyramid: Pyramid,
    chartsLinearGauge: CarbonIcon.ChartBullet,
    chartsMap: CarbonIcon.Plan,
    chartsCandlestick: CarbonIcon.ChartCandlestick,
    chartsOHLC: CarbonIcon.ChartHighLow,
};

export const ICON_MAP = {
    info: CarbonIcon.Information,
    warning: CarbonIcon.WarningAlt,
    creditCard: CarbonIcon.Purchase,
    lightBulb: CarbonIcon.Idea,
    enterprise: EnterpriseIcon,
    collapseCategories: CarbonIcon.CollapseCategories,
    search: CarbonIcon.Search,
    arrowUp: CarbonIcon.ArrowUp,
    arrowRight: CarbonIcon.ArrowRight,
    arrowDown: CarbonIcon.ArrowDown,
    arrowLeft: CarbonIcon.ArrowLeft,
    return: CarbonIcon.Return,
    link: CarbonIcon.Link,
    mapPin: CarbonIcon.LocationFilled,
    chevronUp: BoldChevronUp,
    chevronRight: BoldChevronRight,
    chevronDown: BoldChevronDown,
    chevronLeft: BoldChevronLeft,
    replaydemo: ReplayDemoIcon,
    takeControl: TakeControlIcon,
    playCircle: CarbonIcon.PlayFilled,
    download: CarbonIcon.Download,
    executableProgram: CarbonIcon.ExecutableProgram,
    eye: CarbonIcon.View,
    code: CarbonIcon.Code,
    tick: TickIcon,
    check: CarbonIcon.Checkmark,
    cross: CrossIcon,
    plunker: PlunkerIcon,
    stackblitz: StackBlitzIcon,
    codesandbox: CodeSandboxIcon,
    maximize: maximizeIcon,
    minimize: minimizeIcon,
    idea: CarbonIcon.DataEnrichment,
    sun: CarbonIcon.Sun,
    moon: CarbonIcon.Moon,
    flash: CarbonIcon.Flash,
    movement: CarbonIcon.Movement,
    zoomArea: CarbonIcon.ZoomArea,
    colorPalette: CarbonIcon.ColorPalette,
    newTab: NewTabIcon,
    sort: CarbonIcon.ChevronSort,
    escape: EscapeIcon,
    pageResult: PageResult,
    codeResult: CodeResult,
    headingResult: HeadingResult,
    listBoxes: CarbonIcon.List,
    figmaCommunity: FigmaIcon,
    copy: CarbonIcon.Copy,
    play: CarbonIcon.PlayFilled,
    pause: CarbonIcon.PauseOutlineFilled,
    speed: CarbonIcon.MeterAlt,
    ...SOCIALS_ICON_MAP,
    ...DOCS_CATEGORIES_ICON_MAP,
    ...HOMEPAGE_FEATURES_ICON_MAP,
    ...CHARTS_ICON_MAP,
};

export type IconName = keyof typeof ICON_MAP;

type Props = { name: IconName; svgClasses?: string; onClick?: () => void };

export const Icon = ({ name, svgClasses, onClick }: Props) => {
    const IconSvg = ICON_MAP[name];

    return IconSvg ? (
        <IconSvg size="32" className={classNames(styles.icon, 'icon', svgClasses)} onClick={onClick} />
    ) : null;
};
