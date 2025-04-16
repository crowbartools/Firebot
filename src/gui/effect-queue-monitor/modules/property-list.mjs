const propertyList = {
    props: {
        properties: {
            type: Array,
            required: true
        },
        title: {
            type: String,
            default: "Properties"
        },
        emptyMessage: {
            type: String,
            default: "No properties available."
        }
    },
    methods: {
        formatValue(value) {
            if (value === null || value === undefined) {
                return 'Not set';
            } else if (typeof value === 'object') {
                return Array.isArray(value)
                    ? `Array (${value.length} items)`
                    : `Object (${Object.keys(value).length} properties)`;
            } else if (typeof value === 'boolean') {
                return value ? 'Yes' : 'No';
            } else if (value === '') {
                return 'Empty string';
            }
            return value.toString();
        },
        toggleExpandObject(key) {
            if (!this.expandedProperties.includes(key)) {
                this.expandedProperties.push(key);
            } else {
                this.expandedProperties = this.expandedProperties.filter(k => k !== key);
            }
        },
        isObject(value) {
            return value !== null && typeof value === 'object';
        },
        isPrimitive(value) {
            return value === null ||
                   value === undefined ||
                   typeof value !== 'object';
        },
        hasValue(value) {
            return value !== null && value !== undefined;
        }
    },
    data() {
        return {
            expandedProperties: []
        };
    },
    template: `
        <div class="effect-properties">
            <h4>{{ title }}</h4>

            <div v-if="properties.length === 0" class="no-properties-message">
                {{ emptyMessage }}
            </div>

            <div v-else class="item-list">
                <div v-for="[key, value] in properties" :key="key" class="item">
                    <div class="item-header" :class="{ 'expandable': isObject(value) }" @click="isObject(value) && toggleExpandObject(key)">
                        <div class="item-left">
                            <div class="item-content">
                                <div class="item-name">
                                    {{ key }}
                                </div>
                            </div>
                        </div>
                        <div class="item-right">
                            <div class="item-detail">{{ formatValue(value) }}</div>
                            <chevron-icon v-if="isObject(value)" :direction="expandedProperties.includes(key) ? 'up' : 'down'" />
                        </div>
                    </div>
                    <div v-if="isObject(value) && expandedProperties.includes(key)" class="item-expansion-container">
                        <pre>{{ JSON.stringify(value, null, 2) }}</pre>
                    </div>
                </div>
            </div>

            <!-- <div v-else class="property-list">
                <div v-for="[key, value] in properties" :key="key" class="property-item">
                    <div class="property-header" :class="{ 'expandable': isObject(value) }" @click="isObject(value) && toggleExpandObject(key)">
                        <div class="property-name">{{ key }}</div>
                        <div v-if="isPrimitive(value)" class="property-value">{{ formatValue(value) }}</div>
                        <div v-else class="property-toggle">
                            <span class="toggle-icon" :class="{ 'expanded': expandedProperties.includes(key) }">
                                {{ expandedProperties.includes(key) ? '▼' : '▶' }}
                            </span>
                            <span class="object-summary">{{ formatValue(value) }}</span>
                        </div>
                    </div>

                    <div v-if="isObject(value) && expandedProperties.includes(key)" class="property-details">
                        <pre class="object-content">{{ JSON.stringify(value, null, 2) }}</pre>
                    </div>
                </div>
            </div> -->
        </div>
    `
};

export { propertyList };