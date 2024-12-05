export default {
    template: `
      <div class="cell-renderer-outer">
      <form>
        <div>
          <div>
            <label>
              Call Id:<br>
              <input type="text" :value="firstRecord.callId">
            </label>
          </div>
          <div>
            <label>
              Number:<br>
              <input type="text" :value="firstRecord.number">
            </label>
          </div>
          <div>
            <label>
              Direction:<br>
              <input type="text" :value="firstRecord.direction">
            </label>
          </div>
        </div>
      </form>
      </div>
    `,
    data: function () {
        return {
            firstRecord: {},
        };
    },
    mounted() {
        this.firstRecord = this.params.data.callRecords[0];
    },
    methods: {
        // called when the cell is refreshed
        refresh() {
            return false;
        },
    },
};
