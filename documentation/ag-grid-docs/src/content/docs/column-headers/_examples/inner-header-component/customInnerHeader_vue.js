export default {
    template: `
      <div class="customInnerHeader">
        <i v-if="params.icon" class="fa" :class="params.icon"></i>
        <span>{{ params.displayName }}</span>
      </div>
    `,
};
