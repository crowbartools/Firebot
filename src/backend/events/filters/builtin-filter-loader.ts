import { EventFilter } from "../../../types/events";
import { FilterManager } from "./filter-manager";
import filters from "./builtin";

export function loadFilters() {
    for (const definition of filters) {
        FilterManager.registerFilter(definition as EventFilter);
    }
}