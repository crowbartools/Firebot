const chip = {
    props: {
        label: {
            type: String
        },
        value: {
            type: String,
            required: true
        }
    },
    template: `
        <div class="chip">
            <span v-if="label?.length" class="chip-label">{{ label }}</span>
            <span class="chip-value">{{ value }}</span>
        </div>
    `
};

export { chip };