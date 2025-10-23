import type { ReplaceVariable } from "../../../../types/variables";
import * as cloudSync from "../../../cloud-sync";

const model : ReplaceVariable = {
    definition: {
        handle: "profilePageBytebinToken",
        description: "Get bytebin id for streamer profile. Access the json by going to https://bytebin.lucko.me/ID-HERE.",
        possibleDataOutput: ["text"],
        hidden: true
    },
    evaluator: async (trigger, page: "commands" | "quotes" = "commands") => {
        return await cloudSync.syncProfileData({
            username: trigger.metadata.username,
            userRoles: [],
            profilePage: page
        });
    }
};

export default model;