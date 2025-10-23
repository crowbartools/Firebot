import type { ReplaceVariable } from "../../../../types/variables";
import { CounterManager } from "../../../counters/counter-manager";

const model: ReplaceVariable = {
    definition: {
        handle: "counter",
        usage: "counter[name]",
        description: "Displays the value of the given counter.",
        categories: ["numbers"],
        possibleDataOutput: ["number"]
    },
    evaluator: (_, name: string) => {
        const counter = CounterManager.getItemByName(name);
        return counter ? counter.value : -1;
    }
};

export default model;