export default {
    template: `
      <div class="custom-tooltip">
        <div :class="'panel panel-' + type">
          <div class="panel-heading">
            <h3 class="panel-title">{{ country }}</h3>
          </div>
          <form class="panel-body" @submit="onFormSubmit($event)">
            <div class="form-group">
              <input type="text" class="form-control" id="name" placeholder="Name" autocomplete="off" :value="athlete" @focus="$event.target.select()" />
              <button type="submit" class="btn btn-primary">Submit</button>
            </div>
            <p>Total: {{total}}</p>
          </form>
        </div>
      </div>`,
    data: function () {
        return {
            type: null,
            athlete: null,
            country: null,
            total: null,
        };
    },
    beforeMount() {
        const data = this.params.api.getDisplayedRowAtIndex(this.params.rowIndex).data;
        this.type = this.params.type || 'primary';
        this.athlete = data.athlete;
        this.country = data.country;
        this.total = data.total;
    },
    methods: {
        onFormSubmit(e) {
            e.preventDefault();
            const { params } = this;
            const { node } = params;

            const target = e.target.querySelector('input');

            if (target.value) {
                node.setDataValue('athlete', target.value);
                if (this.params.hideTooltipCallback) {
                    this.params.hideTooltipCallback();
                }
            }
        },
    },
};
