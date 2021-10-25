module.exports = {
    // Extend from recommened eslint rules
    // Indicated by a wrench @ https://eslint.org/docs/rules/
    "extends": "eslint:recommended",

    "parserOptions": {
        "ecmaVersion": 10
    },

    "env": {
        "node": true,
        "browser": true,
        "es6": true
    },

    // Project specific globals
    "globals": {
        "renderWindow": true,
        "$": true
    },

    "rules":{

        // Deviations from https://eslint.org/docs/rules/#possible-errors
        "no-console": 0, // Enable the use of console

        // Deviations from < https://eslint.org/docs/rules/#best-practices >
        "eqeqeq": ["warn", "smart"],     // No coersion unless comparing against null
        "guard-for-in": "warn",          // require an if statement with for-in loops
        "no-else-return": "warn",        // no 'if () { return } else { ... }
        "no-eval": "warn",               // no eval()
        "no-floating-decimal": "warn",   // no trailing decimals after numbers
        "no-lone-blocks": "warn",        // see: https://eslint.org/docs/rules/no-lone-blocks
        "no-multi-spaces": "warn",       // no repeating spaces
        "no-throw-literal": "warn",      // must throw an error instance
        "no-unused-expressions": "warn", // see: https://eslint.org/docs/rules/no-unused-expressions#disallow-unused-expressions-no-unused-expressions
        "no-with": "warn",               // no with statements
        "wrap-iife": "warn",             // immediately called functions must be wrapped in ()'s

        // Deviation from < https://eslint.org/docs/rules/#strict-mode >
        "strict": "warn", // require strict mode

        // Deviation from < https://eslint.org/docs/rules/#variables >
        "no-use-before-define": "warn", // require vars to be defined before use

        // Deviation from < https://eslint.org/docs/rules/#stylistic-issues >
        "array-bracket-spacing": "warn",                       // Spaces around array []'s
        "block-spacing": "warn",                               // {}'s must have whitespace around them
        "brace-style": "warn",                                 // See: https://eslint.org/docs/rules/brace-style#require-brace-style-brace-style
        "camelcase": "warn",                                   // useCamelCasePleaseKThanks
        "comma-dangle": "warn",                                // No trailing commas
        "comma-spacing": "warn",                               // Reqire space after commas
        "comma-style": "warn",                                 // See: https://eslint.org/docs/rules/comma-style
        "computed-property-spacing": "warn",                   // No whitespace when using object[thing]
        "curly": "warn",                                       // Must wrap blocks with {}
        "indent": ["warn", 4],                                 // Four-space indentions
        "key-spacing": ["warn", {mode: "strict" }],            // Exactly one space after object key colons
        "keyword-spacing": "warn",                             // Spaces around keywords
        "linebreak-style": "warn",                             // Line breaks must be \n
        "new-cap": "warn",                                     // Constructors must start with capital letter
        "no-trailing-spaces": "warn",                          // no trailing spaces
        "semi": "warn",                                        // semi-colons required
        "semi-spacing": ["warn", {before: false, after: true}],// space after semi-colon, no space before
        "semi-style": "warn",                                  // See: https://eslint.org/docs/rules/semi-style
        "space-before-blocks": "warn",                         // whitespace required before and after {}
        "space-in-parens": ["warn", "never"],                  // See: https://eslint.org/docs/rules/space-in-parens
        "space-infix-ops": "warn",                             // Spaces required areound operators
        "space-unary-ops": "warn",                             // See: https://eslint.org/docs/rules/space-unary-ops
        "switch-colon-spacing": "warn",                        // Spaces after case colon

        // Deviation from < https://eslint.org/docs/rules/#ecmascript-6 >
        "arrow-spacing": "warn",                               // Spaces required around fat-arrow function's "=>"
        "no-confusing-arrow": "warn",                          // Don't use arrows functions in conditions
        "no-var": "warn",                                      // Use let/const instead of var

        // Other deviations
        "no-warning-comments": ["warn", {"terms": ["todo", "to do", "fix", "fixme", "fix me", "need"], "location": "start"}], // warn about todo comments
        "no-unused-vars": ["warn"]
    }
}