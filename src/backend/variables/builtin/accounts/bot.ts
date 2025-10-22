import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";
import { AccountAccess } from "../../../common/account-access";

const model : ReplaceVariable = {
    definition: {
        handle: "bot",
        description: "Outputs the Bot account username.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: () => {
        return AccountAccess.getAccounts().bot?.loggedIn === true
            ? AccountAccess.getAccounts().bot.username
            : "Unknown Bot";
    }
};

export default model;
