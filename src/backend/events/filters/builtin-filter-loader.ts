import filterManager from "./filter-manager";
import metadataKeyFilter from "./builtin/metadata-key";
import metadataValueFilter from "./builtin/metadata-value";

export function loadFilters() {
    filterManager.registerFilter(metadataKeyFilter);
    filterManager.registerFilter(metadataValueFilter);

    [
        'bits-badge-tier',
        'chat-mode-duration',
        'chat-mode-setting',
        'chat-mode',
        'cheer-bits-amount',
        'currency',
        'custom-variable-name',
        'donation-amount',
        'donation-from',
        'gift-count',
        'gift-duration',
        'is-anonymous',
        'message',
        'new-currency-amount',
        'new-rank',
        'new-view-time',
        'previous-currency-amount',
        'previous-rank',
        'previous-view-time',
        'raid-viewer-count',
        'rank-ladder',
        'rank-transition-type',
        'reward-name',
        'reward',
        'stream-category',
        'sub-kind',
        'sub-type',
        'username',
        'viewer-ranks',
        'viewer-roles'
    ].forEach((filename) => {
        const definition = require(`./builtin/${filename}.js`);
        filterManager.registerFilter(definition);
    });
}
