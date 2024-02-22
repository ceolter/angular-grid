import {
    AgGroupComponentParams,
    Autowired,
    Component,
    PostConstruct,
} from "@ag-grid-community/core";
import { ChartTranslationService } from "../../../services/chartTranslationService";
import { ChartOptionsProxy } from "../../../services/chartOptionsService";
import { ChartMenuUtils } from "../../chartMenuUtils";

export class CapsPanel extends Component {

    public static TEMPLATE = /* html */
        `<div>
            <ag-group-component ref="capsGroup">
                <ag-slider ref="capLengthRatioSlider"></ag-slider>
            </ag-group-component>
        </div>`;

    @Autowired('chartTranslationService') private readonly chartTranslationService: ChartTranslationService;
    @Autowired('chartMenuUtils') private readonly chartMenuUtils: ChartMenuUtils;

    constructor(private readonly chartOptionsProxy: ChartOptionsProxy) {
        super();
    }

    @PostConstruct
    private init() {
        const capsGroupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-sub-level',
            direction: 'vertical',
            title: this.chartTranslationService.translate("cap"),
            enabled: true,
            suppressOpenCloseIcons: true,
            suppressEnabledCheckbox: true,
        };
        const capLengthRatioSliderParams = this.chartMenuUtils.getDefaultSliderParams(this.chartOptionsProxy, "cap.lengthRatio", "capLengthRatio", 1);
        capLengthRatioSliderParams.step = 0.05;

        this.setTemplate(CapsPanel.TEMPLATE, {
            capsGroup: capsGroupParams,
            capLengthRatioSlider: capLengthRatioSliderParams
        });
    }
}
