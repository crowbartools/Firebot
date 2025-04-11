const queueLabel = {
    props: ["name", "value"],
    template: `
        <div class="label">
            <div class="label-name">{{ name }}</div>
            <div class="label-value">{{ value }}</div>
        </div>
    `
};

export { queueLabel };