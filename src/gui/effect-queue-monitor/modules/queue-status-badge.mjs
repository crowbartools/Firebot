const queueStatusBadge = {
    props: ["queue"],
    computed: {
        itemCount() {
            const activeItemsCount = this.queue.state.activeItems ? this.queue.state.activeItems.length : 0;
            const queuedItemsCount = this.queue.state.queuedItems ? this.queue.state.queuedItems.length : 0;
            return activeItemsCount + queuedItemsCount;
        },
        status() {
            return this.queue.state.status;
        }
    },
    template: `
        <div class="queue-status-badge" :class="status">
            <div v-if="status === 'running'" style="margin-right: 5px;">
                <running-icon></running-icon>
            </div>
            <i v-if="status === 'paused' || status === 'cancelled'" class="far fa-pause-circle" style="font-size: 18px; margin-right: 5px;transform: translateY(1px);"></i>
            <i v-if="status === 'idle'" class="far fa-clock" style="font-size: 18px; margin-right: 5px;transform: translateY(1px);"></i>
            <span style="text-transform: capitalize">{{ status }}</span>
            <span v-if="itemCount && itemCount > 0" class="queue-item-count">{{ itemCount }}</span>
        </div>
    `
};

export { queueStatusBadge };