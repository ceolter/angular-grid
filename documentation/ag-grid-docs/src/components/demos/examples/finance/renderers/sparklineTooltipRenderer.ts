export function sparklineTooltipRenderer(params: any) {
    return {
        content: params.yValue.toFixed(2),
    };
}
