import { createEventDataVariable } from "../../../variable-factory";

export default createEventDataVariable({
    handle: "isDemotion",
    description: "Whether or not the new rank from the Viewer Rank Changed event is a demotion",
    events: ["firebot:viewer-rank-updated"],
    type: "bool",
    eventMetaKey: "isDemotion"
});