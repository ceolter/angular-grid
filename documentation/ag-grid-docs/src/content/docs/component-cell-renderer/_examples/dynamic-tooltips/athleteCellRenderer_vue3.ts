export default {
    template: `<div :ref="'wrapper'" style="overflow: hidden; text-overflow: ellipsis">{{ displayValue }}</div>`,
    data: function () {
        return {
            displayValue: '',
        };
    },
    beforeMount() {
        this.displayValue = this.params.value;
        this.params.setTooltip(
            `Dynamic Tooltip for ${this.params.value}`,
            () => this.$refs.wrapper.scrollWidth > this.$refs.wrapper.clientWidth
        );
    },
};
