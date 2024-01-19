import { ReplaceVariable } from "../../../../../types/variables";

import category from './category';

const model : ReplaceVariable = {
    definition: {
        handle: "game",
        description: category.definition.description,
        examples: [
            {
                usage: "game[$target]",
                description: "When in a command, gets the category/game set for the target user."
            },
            {
                usage: "game[$user]",
                description: "Gets the category/game set for associated user (i.e. who triggered command, pressed button, etc)."
            },
            {
                usage: "game[ChannelOne]",
                description: "Gets the category/game set for a specific channel."
            }
        ],
        categories: category.definition.categories,
        possibleDataOutput: category.definition.possibleDataOutput
    },
    evaluator: category.evaluator
};

export default model;