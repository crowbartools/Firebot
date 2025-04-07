const queueStatusBadge = {
    props: ["status"],
    computed: {
        iconUrl() {
            const statusMap = {
                running: "running.gif",
                paused: "pause.svg",
                idle: "clock-outline.svg",
                cancelled: "pause.svg"
            };
            return `./images/${statusMap[this.status]}`;
        }
    },
    template: `
        <div class="queue-status-badge" :class="status">
            <div v-if="status === 'running'" style="margin-right: 5px;">
                <running-icon></running-icon>
            </div>
            <pause-icon v-if="status === 'paused' || status === 'cancelled'"></pause-icon>
            <clock-icon v-if="status === 'idle'"></clock-icon>
            <span style="text-transform: capitalize">{{ status }}</span>
        </div>
    `
};

export { queueStatusBadge };