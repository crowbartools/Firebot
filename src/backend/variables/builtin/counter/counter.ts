import type { ReplaceVariable } from "../../../../types/variables";
import { CounterManager } from "../../../counters/counter-manager";

const model: ReplaceVariable = {
    definition: {
        handle: "counter",
        usage: "counter[name]",
        hasSuggestions: true,
        noSuggestionsText: "No counters have been created yet.",
        description: "Displays the value of the given counter.",
        categories: ["numbers"],
        possibleDataOutput: ["number"]
    },
    getSuggestions: () => {
        const counters = CounterManager.getAllItems();
        return counters.flatMap(c => ([
            {
                usage: `counter[${c.name}]`,
                description: `Get the current ${c.name} value`
            }
        ]));
    },

    evaluator: (_, name: string) => {
        const counter = CounterManager.getItemByName(name);
        return counter ? counter.value : -1;
    }
};

export default model;