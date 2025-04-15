import { propertyList } from './property-list.mjs';

const effectDetailModal = {
    props: {
        effect: {
            type: Object,
            required: true
        },
        show: {
            type: Boolean,
            default: false
        }
    },
    components: {
        'property-list': propertyList
    },
    methods: {
        close() {
            this.$emit('close');
        },
        stopPropagation(event) {
            event.stopPropagation();
        },
        toggleExpandObject(key) {
            if (!this.expandedProperties.includes(key)) {
                this.expandedProperties.push(key);
            } else {
                this.expandedProperties = this.expandedProperties.filter(k => k !== key);
            }
        },
        isObject(value) {
            return value != null && typeof value === 'object';
        },
        isPrimitive(value) {
            return value == null ||
                   typeof value !== 'object';
        }
    },
    data() {
        return {
            expandedProperties: []
        };
    },
    computed: {
        effectWithoutDefinition() {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { __definition, ...rest } = this.effect;
            return rest;
        },
        effectName() {
            return this.effect.__definition?.name ?? "Unknown Effect";
        },
        effectIconClass() {
            return this.effect.__definition?.icon ?? 'fad fa-magic';
        },
        effectId() {
            return this.effect.id ?? "Not set";
        },
        isEffectEnabled() {
            return this.effect.active !== false;
        },
        effectProperties() {
            return Object.entries(this.effectWithoutDefinition)
                .filter(([key, value]) =>
                    !['id', 'type', 'active', 'effectLabel'].includes(key) &&
                    value != null
                )
                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
        }
    },
    template: `
        <transition name="modal-fade">
            <div
                v-if="show"
                class="modal-overlay"
                @click="close"
            >
                <div
                    class="modal-container effect-modal-container"
                    @click="stopPropagation"
                >
                    <div class="modal-header">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <i :class="effectIconClass" style="font-size: 25px;"></i>
                            <h3>{{ effectName }}</h3>
                            <span v-if="effect.effectLabel" style="font-size: 14px; color: #888; font-style: italic;">
                                {{ effect.effectLabel }}
                            </span>
                        </div>
                        <button @click="close" class="modal-close-button">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content effect-modal-content">
                        <div class="effect-meta-chips">
                            <chip
                                label="ID:"
                                :value="effectId"
                            />
                            <chip
                                label="Enabled:"
                                :value="isEffectEnabled ? 'Yes' : 'No'"
                            />
                        </div>

                        <property-list
                            :properties="effectProperties"
                            title="Properties"
                            empty-message="This effect has no additional properties."
                        />

                        <div class="effect-raw-data">
                            <div class="raw-data-header" @click="toggleExpandObject('rawData')">
                                <h4>Raw Data</h4>
                                <chevron-icon
                                    :direction="expandedProperties.includes('rawData') ? 'up' : 'down'"
                                />
                            </div>
                            <pre v-if="expandedProperties.includes('rawData')" class="json-content">{{ JSON.stringify(effectWithoutDefinition, null, 2) }}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    `
};

export { effectDetailModal };