export default {
    template: `
      <span>
      <i :class="iconClass"> </i> {{ value }}
    </span>
  `,
    data: function () {
        return {
            iconClass: null,
            value: '',
        };
    },
    beforeMount() {
        this.iconClass = this.params.value === 'Male' ? 'fa fa-male' : 'fa fa-female';
        this.value = this.params.value;
    },
};
