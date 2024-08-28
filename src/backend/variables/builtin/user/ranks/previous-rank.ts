import { createEventDataVariable } from "../../../variable-factory";

export default createEventDataVariable({
    handle: "previousRank",
    description: "The name of the associated previous rank of the Viewer Rank Changed event",
    events: ["firebot:viewer-rank-updated"],
    type: "text",
    eventMetaKey: "previousRankName"
});