export default {
    template: `
        <div style="display: flex">
            <span v-if="enableFilterButton" ref="menuButton" class="ag-icon ag-icon-menu" @click="onMenuClicked($event)"></span>
            <div class="customHeaderLabel">{{ displayName }}</div>
            <div v-if="enableSorting" @click="onSortRequested('asc', $event)" :class="ascSort"
                 class="customSortDownLabel"><i class="fa fa-long-arrow-alt-down"></i></div>
            <div v-if="enableSorting" @click="onSortRequested('desc', $event)" :class="descSort"
                 class="customSortUpLabel"><i class="fa fa-long-arrow-alt-up"></i></div>
            <div v-if="enableSorting" @click="onSortRequested('', $event)" :class="noSort"
                 class="customSortRemoveLabel"><i class="fa fa-times"></i></div>
        </div>
    `,
    data: function () {
        return {
            ascSort: null,
            descSort: null,
            noSort: null,
            enableFilterButton: false,
            enableSorting: false,
            displayName: null,
        };
    },
    beforeMount() {
        this.enableFilterButton = this.params.enableFilterButton;
        this.enableSorting = this.params.enableSorting;
        this.displayName = this.params.displayName;
    },
    mounted() {
        console.log('CustomHeader - mounted() -> ' + this.params.column.getId());

        this.params.column.addEventListener('sortChanged', this.onSortChanged);
        this.onSortChanged();
    },
    unmounted() {
        console.log('CustomHeader unmounted() -> ' + this.params.column.getId());
    },
    methods: {
        onMenuClicked() {
            this.params.showColumnMenu(this.$refs.menuButton);
        },

        onSortChanged() {
            this.ascSort = this.descSort = this.noSort = 'inactive';
            const sort = this.params.column.getSort();
            if (sort === 'asc') {
                this.ascSort = 'active';
            } else if (sort === 'desc') {
                this.descSort = 'active';
            } else {
                this.noSort = 'active';
            }
        },

        onSortRequested(order, event) {
            this.params.setSort(order, event.shiftKey);
        },

        refresh(params) {
            console.log('CustomHeader refresh() -> ' + this.params.column.getId());

            this.enableFilterButton = params.enableFilterButton;
            this.enableSorting = params.enableSorting;
            this.displayName = params.displayName;
            return true;
        },
    },
};
