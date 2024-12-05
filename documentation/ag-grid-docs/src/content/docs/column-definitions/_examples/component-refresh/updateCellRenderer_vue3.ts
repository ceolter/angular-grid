export default {
    template: `
        <div>        
            <button v-on:click="onClick">Update Data</button>
        </div>
    `,
    methods: {
        onClick() {
            const { node } = this.params;
            const { gold, silver, bronze } = node.data;
            node.updateData({
                ...node.data,
                gold: gold + 1,
                silver: silver + 1,
                bronze: bronze + 1,
            });
        },
    },
};
