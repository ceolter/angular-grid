export default {
    template: `
        <div :style="{overflow: 'hidden', textOverflow: 'ellipsis'}">
            <span :style="{paddingRight: '5px', borderLeft: '10px solid ' + params.value}"></span>
            {{params.value}}
        </div>
    `,
};
