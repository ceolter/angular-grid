export default {
    template: `
        <div class="ag-header-group-cell-label">
            <div ref="label" class="customHeaderLabel">{{params.displayName}}</div>
            <div class="customExpandButton" :class="{expanded : groupExpanded, collapsed : !groupExpanded}" v-on:click="expandOrCollapse"><i class="fa fa-arrow-right"></i></div>
        </div>
    `,
    data: function () {
        return {
            groupExpanded: false,
        };
    },
    beforeMount() {},
    mounted() {
        this.params.columnGroup
            .getProvidedColumnGroup()
            .addEventListener('expandedChanged', this.syncExpandButtons.bind(this));
        this.params.setTooltip(this.params.displayName, () => {
            if (!this.$refs.label) {
                return false;
            }
            return this.$refs.label.scrollWidth > this.$refs.label.clientWidth;
        });
        this.syncExpandButtons();
    },
    methods: {
        expandOrCollapse() {
            let currentState = this.params.columnGroup.getProvidedColumnGroup().isExpanded();
            this.params.setExpanded(!currentState);
        },
        syncExpandButtons() {
            this.groupExpanded = this.params.columnGroup.getProvidedColumnGroup().isExpanded();
        },
    },
};
