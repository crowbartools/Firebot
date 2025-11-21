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
      <template v-for="item in computedMenuItems" :key="item.label">
        <li
          v-if="item.visible == null ? true : item.visible(contextQueue)"
          @click="handleItemClick(item)"
          @mouseenter="hovered = item.label"
          :class="{ hovered: hovered === item.label }"
        >
          <i
            :class="[item.icon]"
            :style="{ fontSize: '18px', marginRight: '5px', transform: 'translateY(1px)' }"
          ></i>
          {{ item.label }}
        </li>
      </template>
     </ul>
  `,
    data() {
        return {
            visible: false,
            hovered: null,
            contextQueue: null,
            menuStyle: {
                top: '0px',
                left: '0px'
            }
        };
    },
    computed: {
        computedMenuItems() {
            return this.menuItems;
        }
    },
    methods: {
        open(event, queue) {
            event.preventDefault();
            this.contextQueue = queue;
            this.menuStyle.top = `${event.clientY}px`;
            this.menuStyle.left = `${event.clientX}px`;
            this.visible = true;
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