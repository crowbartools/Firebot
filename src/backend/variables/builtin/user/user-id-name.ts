// Deprecated
import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";
import { EffectTrigger } from "../../../../shared/effect-constants";
import user from "../metadata/user";

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = true;
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.CUSTOM_SCRIPT] = true;
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.CHANNEL_REWARD] = true;
triggers[EffectTrigger.QUICK_ACTION] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "useridname",
        description: "(Deprecated: Use $user or $username) The associated underlying user identifying name for the given trigger.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT],
        hidden: true
    },
    evaluator: user.evaluator
};

export default model;