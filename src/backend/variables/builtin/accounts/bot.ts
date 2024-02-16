import { ReplaceVariable} from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";

const accountAccess = require("../../../common/account-access");

const model : ReplaceVariable = {
    definition: {
        handle: "bot",
        description: "Outputs the Bot account username.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: () => {
        if (accountAccess.getAccounts().bot.loggedIn) {
            return accountAccess.getAccounts().bot.username;
        }
        return "Unknown Bot";
    }
};

export default model;
