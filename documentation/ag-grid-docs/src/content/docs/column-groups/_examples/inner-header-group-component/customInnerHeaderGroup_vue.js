export default {
    template: `
      <div class="customInnerHeaderGroup">
        <i v-if="params.icon" class="fa" :class="params.icon"></i>
        <span>{{ params.displayName }}</span>
      </div>
    `,
};
