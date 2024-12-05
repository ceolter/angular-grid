export default {
    template: `
    <div>
      <div class="show-name">
        {{ showName }}
      </div>
      <div class="show-presenter">
        {{ showPresenter }}
      </div>
    </div>
    `,
    data: function () {
        return {
            showName: '',
            showPresenter: '',
        };
    },
    beforeMount() {
        if (!this.params.value) {
            return;
        }
        this.showName = this.params.value.name;
        this.showPresenter = this.params.value.presenter;
    },
};
