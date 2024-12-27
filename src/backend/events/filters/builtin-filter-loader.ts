import filterManager from "./filter-manager";
import filters from "./builtin";

export function loadFilters() {
    for (const definition of filters) {
        filterManager.registerFilter(definition);
    }
}