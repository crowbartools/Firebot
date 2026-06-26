type ExpressionishBaseToken = {
    type: "TEXT" | "VARIABLE" | "LOOKUP" | "IF" | "LOGICAL" | "CONDITION" | "UNKNOWN";

    /**
     * Rough character position of the token within the input string
     */
    position: number;

    /**
     * Depends on token type.
     *
     * `TEXT` or `UNKNOWN`: raw text value
     *
     * `VAR`, `IF`, or `LOOKUP`: name of variable
     *
     * `CONDITION` or `LOGICAL`: operator
     */
    value: string;

};

type ExpressionishTokenWithArguments = {
    /**
     * Arguments to resolve then pass to calling registered handler
     */
    arguments: Array<ExpressionishToken>;
};

type ExpressionishTextToken = ExpressionishBaseToken & {
    type: "TEXT";
};

type ExpressionishLookupToken = ExpressionishBaseToken & ExpressionishTokenWithArguments & {
    type: "LOOKUP";

    /**
     * Lookup prefix
     */
    prefix: string;
};

type ExpressionishVariableToken = ExpressionishBaseToken & ExpressionishTokenWithArguments & {
    type: "VARIABLE";
};

type ExpressionishComparisonToken = ExpressionishBaseToken & ExpressionishTokenWithArguments & {
    type: "CONDITION";
};

type ExpressionishLogicToken = ExpressionishBaseToken & ExpressionishTokenWithArguments & {
    type: "LOGICAL";
};

type ExpressionishIfToken = ExpressionishBaseToken & ExpressionishTokenWithArguments & {
    type: "IF";

    /**
     * Condition used for evaluation
     */
    condition: ExpressionishLogicToken | ExpressionishComparisonToken;
};

type ExpressionishUnknownToken = ExpressionishBaseToken & {
    type: "UNKNOWN";
};

export type ExpressionishToken =
    | ExpressionishTextToken
    | ExpressionishLookupToken
    | ExpressionishVariableToken
    | ExpressionishComparisonToken
    | ExpressionishLogicToken
    | ExpressionishIfToken
    | ExpressionishUnknownToken;