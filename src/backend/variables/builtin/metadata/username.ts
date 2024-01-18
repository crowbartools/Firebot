import { ReplaceVariable } from "../../../../types/variables";
import user from './user';

const model : ReplaceVariable = {
    definition: {
        ...user.definition,
        handle: "username"
    },
    evaluator: user.evaluator
};

export default model;