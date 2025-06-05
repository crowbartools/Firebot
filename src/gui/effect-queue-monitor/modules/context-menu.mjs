export const contextMenu = {
    name: 'ContextMenu',
    props: {
        menuItems: {
            type: Array,
            default: null
        }
    },
    template: `
     <ul
       v-if="visible"
       class="context-menu"
       :style="menuStyle"
       ref="contextMenu"
       @click.stop
     >
       <li
         v-for="item in menuItems"
         :key="item.label"
         @click="() => handleItemClick(item)"
         @mouseenter="hovered = item.label"
         :class="{ hovered: hovered === item.label }"
       >
         {{ item.label }}
       </li>
     </ul>
  `,
    data() {
        return {
            visible: false,
            hovered: null,
            contextQueue: null,
            internalMenuItems: [],
            menuStyle: {
                top: '0px',
                left: '0px'
            }
        };
    },
    computed: {
        computedMenuItems() {
            return this.menuItems && this.menuItems.length
                ? this.menuItems
                : this.internalMenuItems;
        }
    },
    methods: {
        open(event, queue) {
            event.preventDefault();
            this.contextQueue = queue;
            this.menuStyle.top = `${event.clientY}px`;
            this.menuStyle.left = `${event.clientX}px`;
            this.visible = true;
            if (!this.menuItems || !this.menuItems.length) {
                this.buildDefaultMenuItems();
            }
        },
        buildMenuItems() {
            this.menuItems = [
                {
                    label: 'Option 1',
                    action: queue =>
                        console.log(`Option 1 on ${queue.name}`)
                },
                {
                    label: 'Option 2',
                    action: queue =>
                        console.log(`Option 2 on ${queue.name}`)
                }
            ];
        },
        handleItemClick(item) {
            if (item.action) {
                item.action(this.contextQueue);
            }
            this.close();
        },
        close() {
            this.visible = false;
        },
        handleClickOutside(event) {
            const menu = this.$refs.contextMenu;
            if (this.visible && (!menu || !menu.contains(event.target))) {
                this.close();
            }
        }
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    }
};