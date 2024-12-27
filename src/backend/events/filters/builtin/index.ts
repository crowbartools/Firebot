import firebotFilters from "./firebot";
import thirdPartyFilters from "./third-party";
import twitchFilters from "./twitch";

export default [
    ...firebotFilters,
    ...thirdPartyFilters,
    ...twitchFilters
];