export default {
    template: `
      <div>
      <div v-if="params.enableFilterButton" ref="menuButton" class="customHeaderMenuButton" @click="onMenuClicked($event)">
        <i class="fa" :class="params.menuIcon"></i>
      </div>
      <div class="customHeaderLabel">{{ params.displayName }}</div>
      <div v-if="params.enableSorting" @click="onSortRequested('asc', $event)" :class="ascSort" class="customSortDownLabel">
        <i class="fa fa-long-arrow-alt-down"></i></div>
      <div v-if="params.enableSorting" @click="onSortRequested('desc', $event)" :class="descSort" class="customSortUpLabel">
        <i class="fa fa-long-arrow-alt-up"></i></div>
      <div v-if="params.enableSorting" @click="onSortRequested('', $event)" :class="noSort" class="customSortRemoveLabel">
        <i class="fa fa-times"></i>
      </div>
      </div>
    `,
    data: function () {
        return {
            ascSort: null,
            descSort: null,
            noSort: null,
        };
    },
    beforeMount() {},
    mounted() {
        this.params.column.addEventListener('sortChanged', this.onSortChanged);
        this.onSortChanged();
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
    },
};
