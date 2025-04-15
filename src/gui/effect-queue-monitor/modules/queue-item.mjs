import { chevronIcon } from './chevron-icon.mjs';
import { effectDetailModal } from './effect-detail-modal.mjs';
import { propertyList } from './property-list.mjs';

const queueItem = {
    props: ["item"],
    data: function () {
        return {
            isExpanded: false,
            showEffectModal: false,
            selectedEffect: null
        };
    },
    components: {
        'chevron-icon': chevronIcon,
        'effect-detail-modal': effectDetailModal,
        'property-list': propertyList
    },
    computed: {
        triggerType() {
            const triggerData = this.item?.runEffectsContext?.trigger;
            const isManual = triggerData?.type === "manual";
            if (isManual) {
                const metadata = triggerData?.metadata ?? {};
                let manualTriggerType = undefined;
                if (metadata.command != null) {
                    manualTriggerType = `Command: ${metadata.command.trigger}`;
                } else if (metadata.event != null && metadata.eventSource) {
                    manualTriggerType = `Event: ${metadata.event.name} - ${metadata.eventSource.name}`;
                }
                return `Manual (${manualTriggerType})`;
            }
            return triggerData?.type?.replace(/_/, " ") ?? "Unknown";
        },
        triggeredBy() {
            return this.item?.runEffectsContext?.trigger?.metadata?.username ?? "Unknown";
        },
        numberOfEffects() {
            return this.item?.runEffectsContext?.effects?.list?.length ?? 0;
        },
        triggerProperties() {
            const triggerMetadata = this.item?.runEffectsContext?.trigger?.metadata || {};
            return Object.entries(triggerMetadata)
                .filter(([, value]) => value != null)
                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
        },
        formattedTriggerType() {
            const type = this.item?.runEffectsContext?.trigger?.type;
            if (!type) {
                return "Unknown";
            }
            return type
                .replace(/_/g, " ")
                .replace(/([A-Z])/g, " $1")
                .replace(/^\w/, c => c.toUpperCase());
        }
    },
    methods: {
        toggleExpand() {
            this.isExpanded = !this.isExpanded;
        },
        showEffectDetails(event, effect) {
            // Stop propagation to prevent toggling the expansion
            event.stopPropagation();
            this.selectedEffect = effect;
            this.showEffectModal = true;
        },
        closeModal() {
            this.showEffectModal = false;
            this.selectedEffect = null;
        }
    },
    template: `
    <div class="queue-item"
         :class="{ 'expanded': isExpanded }">
        <div class="queue-item-header"
             @click="toggleExpand"
             :class="{ 'expanded': isExpanded }">
            <div class="queue-list-header-icon-column">
                <div class="queue-status-badge running" style="padding: 4px 10px" v-if="item.active">
                    <running-icon :width="12" :height="12" />
                </div>
            </div>
            <div class="queue-item-cell trigger-type" :title="formattedTriggerType">
                {{ formattedTriggerType }}
            </div>
            <div class="queue-item-cell triggered-by">
                {{ triggeredBy }}
            </div>
            <div class="queue-item-cell effects-count">
                <span class="effects-count-badge">
                    {{ numberOfEffects }}
                </span>
            </div>
            <chevron-icon :direction="isExpanded ? 'up' : 'down'" />
        </div>
        <div class="queue-item-details" v-if="isExpanded">
            <div class="details-divider">
                <div class="details-divider-line"></div>
                <div class="details-divider-text">Trigger</div>
                <div class="details-divider-line"></div>
            </div>
            <div class="trigger-details">
                <div>
                    <h4 class="section-header">Type</h4>
                    <div>{{triggerType}}</div>
                </div>
                <div style="margin-top: 15px;">
                    <property-list
                        :properties="triggerProperties"
                        title="Metadata"
                        empty-message="No additional metadata"
                    />
                </div>
            </div>

            <div class="details-divider" style="margin-top: 20px;">
                <div class="details-divider-line"></div>
                <div class="details-divider-text">Effects</div>
                <div class="details-divider-line"></div>
            </div>
            <div class="item-list">
                <div v-for="(effect, index) in item.runEffectsContext.effects.list"
                    :key="index"
                    class="item"
                    @click="showEffectDetails($event, effect)">
                    <div class="item-header">
                        <div class="item-left">
                            <div class="item-icon">
                                <i :class="effect.__definition?.icon ?? 'fad fa-magic'"></i>
                            </div>
                            <div class="item-content">
                                <div class="item-name">
                                    {{ effect.__definition?.name ?? "Unknown" }}
                                </div>
                                <div class="item-description" v-if="effect.effectLabel">
                                    {{ effect.effectLabel }}
                                </div>
                            </div>
                        </div>
                        <div class="item-right">
                            <chevron-icon direction="right" />
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="!item.runEffectsContext.effects.list || item.runEffectsContext.effects.list.length === 0"
                 class="no-effects-message">
                No effects found
            </div>
        </div>
        <effect-detail-modal
            v-if="selectedEffect"
            :effect="selectedEffect"
            :show="showEffectModal"
            @close="closeModal"
        />
    </div>
    `
};

export { queueItem };