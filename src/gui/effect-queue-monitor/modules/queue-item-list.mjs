const queueItemList = {
    props: ["listName", "noItemsText", "items"],
    computed: {},
    template: `
        <div class="queue-list-container">
            <div class="queue-list-header">
                <div class="queue-list-header-icon-column"></div>
                <div class="queue-list-header-column">Trigger</div>
                <div class="queue-list-header-column">Triggered By</div>
                <div class="queue-list-header-column">Effects</div>
                <div class="queue-list-header-chevron-column"></div>
            </div>
            <div class="queue-list-body">
                <queue-item
                    v-for="queueItem in items"
                    :item="queueItem"
                    :key="queueItem.id"
                ></queue-item>
                <div v-if="items.length === 0" class="queue-list-empty-message">
                    {{ noItemsText }}
                </div>
            </div>
        </div>
    `
};

export { queueItemList };