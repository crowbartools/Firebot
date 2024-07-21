import { createEventDataVariable } from "../../../variable-factory";

export default createEventDataVariable({
    handle: "previousRank",
    description: "The name of the associated previous rank of the Viewer Rank Changed event",
    events: ["firebot:viewer-rank-changed"],
    type: "text",
    eventMetaKey: "previousRankName"
});