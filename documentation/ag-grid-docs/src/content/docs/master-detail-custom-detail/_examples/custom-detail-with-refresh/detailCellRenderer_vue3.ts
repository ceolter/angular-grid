export default {
    template: `
        <div>
            <form>
                <div>
                    <p>
                        <label>
                            Calls:<br>
                            <input type="text" :value="callsCount">
                        </label>
                    </p>
                    <p>
                        <label>
                            Last Updated:<br>
                            {{ now }}
                        </label>
                    </p>
                </div>
            </form>
        </div>
    `,
    data: function () {
        return {
            callsCount: 0,
            now: '',
        };
    },
    mounted() {
        this.callsCount = this.params.data.calls;
        this.now = new Date().toLocaleTimeString();
    },
    methods: {
        // called when the cell is refreshed
        refresh(params) {
            this.callsCount = params.data.calls;
            this.now = new Date().toLocaleTimeString();
            // tell the grid not to destroy and recreate
            return true;
        },
    },
};
