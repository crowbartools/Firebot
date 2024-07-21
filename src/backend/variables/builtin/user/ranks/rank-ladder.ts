import { createEventDataVariable } from "../../../variable-factory";

export default createEventDataVariable({
    handle: "rankLadder",
    description: "The name of the associated rank ladder of the Viewer Rank Changed event",
    events: ["firebot:viewer-rank-updated"],
    type: "text",
    eventMetaKey: "rankLadderName"
});