export default {
    template: `
      <div draggable="true" v-on:dragstart="onDragStart">Drag Me!</div>
    `,
    data: function () {
        return {};
    },
    methods: {
        onDragStart(event) {
            event.dataTransfer.setData('text/plain', 'Dragged item with ID: ' + this.params.node.data.id);
        },
    },
};
