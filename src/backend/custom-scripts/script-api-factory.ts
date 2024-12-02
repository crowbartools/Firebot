import { FirebotScriptApi, ScriptBase } from "../../types/plugins";
import { app } from "electron";


export function buildScriptApi(scriptManifest: ScriptBase["manifest"]): FirebotScriptApi {
    return {
        version: app.getVersion(),
        logger: require("../logwrapper"),
        frontend: require("../common/frontend-communicator"),
        effects: require("../effects/effectManager"),
        replaceVariables: require("../replace-variables/replaceVariableManager")
    };
}