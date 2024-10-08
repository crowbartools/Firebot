/*eslint-disable-next-line no-undef*/
module.exports = {
    parser: "@typescript-eslint/parser",
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier"
    ],
    plugins: ["@typescript-eslint"],
    parserOptions: {
        sourceType: "module",
        ecmaVersion: 2020,
    },
    ignorePatterns: [
        "dist/**/*"
    ],
    rules: {
        "@typescript-eslint/no-unnecessary-type-arguments": "off"
    }
};