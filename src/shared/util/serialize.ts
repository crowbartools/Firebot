export function serialize(input: unknown) {
    let output = "";
    if (input == null) {
        return output;
    }
    if (input instanceof Error) {
        output += input.message;
        if (input.stack) output += ` - ${input.stack}`;
    } else if (typeof input === "object") {
        output += `${JSON.stringify(input, null, 2)}`;
    } else {
        output += input;
    }
    return output;
}
