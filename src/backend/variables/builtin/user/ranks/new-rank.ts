import { createEventDataVariable } from "../../../variable-factory";

export default createEventDataVariable({
    handle: "newRank",
    description: "The name of the associated new rank of the Viewer Rank Changed event",
    events: ["firebot:viewer-rank-changed"],
    type: "text",
    eventMetaKey: "newRankName"
});