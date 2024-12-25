
export type RestrictionData = {
    /**
     * Sets the command to only trigger when all/any/none of the restrictions pass.
     */
    mode?: "all" | "any" | "none";
    /**
     * If a chat message should be sent when the restrictions are not met.
     */
    sendFailMessage?: boolean;
    useCustomFailMessage?: boolean;
    failMessage?: string;
    restrictions: unknown[]; // TODO: change when restriction-manager and companion types are added
    sendAsReply?:boolean;
};