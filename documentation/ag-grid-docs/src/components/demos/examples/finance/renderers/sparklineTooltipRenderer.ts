export function sparklineTooltipRenderer(params: any) {
    const { y } = params.datum;
    return {
        content: y.toFixed(2),
    };
}
