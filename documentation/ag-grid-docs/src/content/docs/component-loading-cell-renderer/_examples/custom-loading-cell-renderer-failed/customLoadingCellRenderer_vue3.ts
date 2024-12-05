export default {
    template: `
      <div class="ag-custom-loading-cell" style="padding-left: 10px; line-height: 25px;">
      <i v-if=params.node.failedLoad class="fas fa-times"></i>
      <span v-if=params.node.failedLoad>Data failed to load</span>
      <div v-else> <i class="fas fa-spinner fa-pulse"></i> <span>{{ params.loadingMessage }}</span> </div>
      </div>
    `,
};
