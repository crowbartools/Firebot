
import { createApp } from 'vue';

import { clockIcon } from "./modules/clock-icon.mjs";
import { pauseIcon } from "./modules/pause-icon.mjs";
import { runningIcon } from "./modules/running-icon.mjs";
import { cogSpinIcon } from './modules/cog-spin-icon.mjs';
import { queueItem } from "./modules/queue-item.mjs";
import { queueStatusBadge } from "./modules/queue-status-badge.mjs";
import { queueHeader } from "./modules/queue-header.mjs";
import { queueItemList } from "./modules/queue-item-list.mjs";
import { queueLabel } from "./modules/queue-label.mjs";

const app = createApp({
    data() {
        return {
            queues: [],
            selectedQueueId: null
        };
    },
    computed: {
        selectedQueue() {
            return this.queues.find(q => q.id === this.selectedQueueId);
        },
        selectedQueueJson() {
            return JSON.stringify(this.selectedQueue, undefined, 2);
        },
        selectedQueueCombinedItems() {
            if (!this.selectedQueue) {
                return [];
            }
            return [
                ...this.selectedQueue.state.activeItems.map(item => ({
                    ...item,
                    active: true
                })),
                ...this.selectedQueue.state.queuedItems.map(item => ({
                    ...item,
                    active: false
                }))
            ];
        }
    }
});

app
    .component('ClockIcon', clockIcon)
    .component('PauseIcon', pauseIcon)
    .component('RunningIcon', runningIcon)
    .component('CogSpinIcon', cogSpinIcon)
    .component('QueueItem', queueItem)
    .component('QueueStatusBadge', queueStatusBadge)
    .component('QueueHeader', queueHeader)
    .component('QueueItemList', queueItemList)
    .component('QueueLabel', queueLabel);


const mountedApp = app.mount('#app');

window.ipcRenderer.on("all-queues", (queues) => {
    console.log("ALL QUEUES", queues);
    mountedApp.queues = queues;
});

window.ipcRenderer.on("queue-created", (queue) => {
    console.log("QUEUE CREATED", queue);
    mountedApp.queues.push(queue);
});

window.ipcRenderer.on("queue-updated", (queue) => {
    console.log("QUEUE UPDATED", queue);
    const index = mountedApp.queues.findIndex(q => q.id === queue.id);
    if (index !== -1) {
        mountedApp.queues.splice(index, 1, queue);
    }
});

window.ipcRenderer.on("queue-deleted", (queueId) => {
    console.log("QUEUE DELETED", queueId);
    mountedApp.queues = mountedApp.queues.filter(q => q.id !== queueId);
});