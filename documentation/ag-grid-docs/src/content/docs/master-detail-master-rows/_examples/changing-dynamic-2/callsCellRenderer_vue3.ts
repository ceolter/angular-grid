export default {
    template: `
        <span class="calls-cell-renderer">
            <button v-on:click="onAdd">+</button>
            <button v-on:click="onRemove">-</button>
            <span>{{ value }}</span>
        </span>
    `,
    data: function () {
        return {};
    },
    computed: {
        value() {
            return this.params.value;
        },
    },
    methods: {
        onAdd() {
            const oldData = this.params.node.data;
            const oldCallRecords = oldData.callRecords;
            const newCallRecords = oldCallRecords.slice(0); // make a copy

            newCallRecords.push({
                name: ['Bob', 'Paul', 'David', 'John'][Math.floor(Math.random() * 4)],
                callId: Math.floor(Math.random() * 1000),
                duration: Math.floor(Math.random() * 100) + 1,
                switchCode: 'SW5',
                direction: 'Out',
                number: '(02) ' + Math.floor(Math.random() * 1000000),
            }); // add one item

            let minutes = 0;
            newCallRecords.forEach(function (r) {
                minutes += r.duration;
            });

            const newData = {
                name: oldData.name,
                account: oldData.account,
                calls: newCallRecords.length,
                minutes: minutes,
                callRecords: newCallRecords,
            };

            this.params.api.applyTransaction({ update: [newData] });

            this.params.node.setExpanded(true);
        },
        onRemove() {
            const oldData = this.params.node.data;

            const oldCallRecords = oldData.callRecords;

            if (oldCallRecords.length === 0) {
                return;
            }

            const newCallRecords = oldCallRecords.slice(0); // make a copy
            newCallRecords.pop(); // remove one item

            let minutes = 0;
            newCallRecords.forEach(function (r) {
                minutes += r.duration;
            });

            const newData = {
                name: oldData.name,
                account: oldData.account,
                calls: newCallRecords.length,
                minutes: minutes,
                callRecords: newCallRecords,
            };

            this.params.api.applyTransaction({ update: [newData] });
        },
    },
};
