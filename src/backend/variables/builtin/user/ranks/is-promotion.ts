import { createEventDataVariable } from "../../../variable-factory";

export default createEventDataVariable({
    handle: "isPromotion",
    description: "Whether or not the new rank from the Viewer Rank Changed event is a promotion",
    events: ["firebot:viewer-rank-updated"],
    type: "bool",
    eventMetaKey: "isPromotion"
});