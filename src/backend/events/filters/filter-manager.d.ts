import { EventFilter } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-filter-manager";

declare class FilterManager {
  registerFilter(filter: EventFilter): void;
}

declare const _FilterManager: FilterManager;
export default _FilterManager;
