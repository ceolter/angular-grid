export default {
    template: `
          <div class="my-custom-cell-renderer">
          <div class="athlete-info">
            <span>{{ athlete }}</span>
            <span>{{ country }}</span>
          </div>
          <span>{{ year }}</span>
          <i class="fas fa-arrows-alt-v" ref="myRef"></i>
          </div>`,
    data: function () {
        return {
            athlete: '',
            country: '',
            year: '',
        };
    },
    beforeMount() {
        this.athlete = this.params.data.athlete;
        this.country = this.params.data.country;
        this.year = this.params.data.year;
    },
    mounted() {
        this.params.registerRowDragger(this.$refs.myRef, 0);
    },
};
