const runningIcon = {
    props: {
        width: {
            type: Number,
            default: 17
        },
        height: {
            type: Number,
            default: 17
        }
    },
    template: `
        <img
            src="./images/running.gif"
            alt="Running Icon"
            :width="width"
            :height="height"
            style="transform: translateY(2px);"
        />
    `
};

export { runningIcon };