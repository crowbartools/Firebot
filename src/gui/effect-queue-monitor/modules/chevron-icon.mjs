const chevronIcon = {
    props: {
        direction: {
            type: String,
            default: 'down',
            validator: value => ['up', 'down', 'left', 'right'].includes(value)
        },
        size: {
            type: Number,
            default: 14
        }
    },
    template: `
        <span class="chevron-icon-container" :class="direction" style="margin-left: 3px;">
            <i class="far fa-chevron-down" :style="{ fontSize: size + 'px' }" style="transform: translateY(1px)"></i>
        </span>
    `
};

export { chevronIcon };