import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import angular from "eslint-plugin-angular";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

export default defineConfig([{
    extends: [
        eslint.configs.recommended,
        tseslint.configs.recommendedTypeChecked
    ],

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        parserOptions: {
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
            ecmaFeatures: {
                globalReturn: true
            }
        },

        globals: {
            ...globals.node,
            ...globals.browser,
            renderWindow: true,
            $: true,
            firebotAppDetails: true,
            angular: true,
            ipcRenderer: true
        }
    },

    plugins: {
        "@stylistic": stylistic,
        "angular": angular
    },

    files: [
        "**/*.ts",
        "**/*.js",
        "**/*.mjs"
    ],

    rules: {
        // ESLint rules
        "camelcase": "warn",
        "curly": "warn",
        "eqeqeq": ["warn", "smart"],
        "guard-for-in": "warn",
        "new-cap": "warn",
        "no-async-promise-executor": "off",
        "no-console": 0,
        "no-debugger": "warn",
        "no-else-return": "warn",
        "no-empty": ["error", {
            allowEmptyCatch: true
        }],
        "no-eval": "warn",
        "no-extra-boolean-cast": "off",
        "no-lone-blocks": "warn",
        "no-prototype-builtins": "off",
        "no-throw-literal": "warn",
        "no-useless-concat": "error",
        "no-var": "warn",
        "no-warning-comments": ["warn", {
            terms: ["todo", "to do", "fix", "fixme", "fix me", "need"],
            location: "start"
        }],
        "no-with": "warn",
        "prefer-const": "warn",
        "prefer-template": "warn",
        "strict": "off",


        // Overridden by TypeScript rules
        "no-unused-expressions": "off",
        "no-unused-vars": "off",
        "no-use-before-define": "off",


        // Style rules
        "@stylistic/array-bracket-spacing": ["warn", "never"],
        "@stylistic/arrow-parens": ["warn", "as-needed", {
            requireForBlockBody: true
        }],
        "@stylistic/arrow-spacing": ["warn", {
            before: true,
            after: true
        }],
        "@stylistic/block-spacing": ["warn", "always"],
        "@stylistic/brace-style": ["warn", "1tbs"],
        "@stylistic/comma-dangle": ["warn", "never"],
        "@stylistic/comma-spacing": ["warn", {
            before: false,
            after: true
        }],
        "@stylistic/comma-style": ["warn", "last"],
        "@stylistic/computed-property-spacing": ["warn", "never"],
        "@stylistic/indent": ["warn", 4],
        "@stylistic/key-spacing": ["warn", {
            beforeColon: false,
            afterColon: true,
            mode: "strict"
        }],
        "@stylistic/keyword-spacing": ["warn", {
            before: true,
            after: true
        }],
        "@stylistic/linebreak-style": ["warn", "unix"],
        "@stylistic/member-delimiter-style": ["warn", {
            multiline: {
                delimiter: "semi",
                requireLast: true
            },
            singleline: {
                delimiter: "comma",
                requireLast: false
            },

        }],
        "@stylistic/no-confusing-arrow": "warn",
        "@stylistic/no-floating-decimal": "warn",
        "@stylistic/no-multi-spaces": "warn",
        "@stylistic/no-trailing-spaces": ["warn", {
            skipBlankLines: false,
            ignoreComments: false
        }],
        "@stylistic/object-curly-spacing": ["warn", "always"],
        "@stylistic/semi": ["warn", "always"],
        "@stylistic/semi-spacing": ["warn", {
            before: false,
            after: true
        }],
        "@stylistic/semi-style": ["warn", "last"],
        "@stylistic/space-before-blocks": ["warn", "always"],
        "@stylistic/space-in-parens": ["warn", "never"],
        "@stylistic/space-infix-ops": "warn",
        "@stylistic/space-unary-ops": ["warn", {
            words: true,
            nonwords: false
        }],
        "@stylistic/switch-colon-spacing": ["warn", {
            before: false,
            after: true
        }],
        "@stylistic/template-curly-spacing": ["warn", "never"],
        "@stylistic/wrap-iife": ["warn", "any"],

        // TypeScript rules
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-base-to-string": "warn",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-empty-object-type": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-floating-promises": "warn",
        "@typescript-eslint/no-misused-promises": ["warn", {
            checksVoidReturn: false
        }],
        "@typescript-eslint/no-redundant-type-constituents": "warn",
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-restricted-types": "warn",
        "@typescript-eslint/no-this-alias": "off",
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-function-type": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
        "@typescript-eslint/no-unused-expressions": "warn",
        "@typescript-eslint/no-unused-vars": ["warn", {
             varsIgnorePattern: "^_"
        }],
        "@typescript-eslint/no-use-before-define": "warn",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-wrapper-object-types": "warn",
        "@typescript-eslint/prefer-promise-reject-errors": "warn",
        "@typescript-eslint/require-await": "warn",
        "@typescript-eslint/restrict-template-expressions": "warn",
        "@typescript-eslint/unbound-method": "off",

        // Angular rules
        ...angular.configs.bestpractices.rules,
        "angular/controller-as": 0,
        "angular/controller-as-route": 0,
        "angular/on-watch": 0,
        "angular/no-controller": 0,
    }
},
{
    ignores: [
        ".git/",
        "node_modules/",
        "src/gui/js/",
        "src/gui/fonts/",
        "src/resources/",
        "Gruntfile.js",
        "eslint.config.mjs",
        "package.json",
        "package-lock.json",
        "dist/",
        "doc/",
        "build/"
    ]
},
{
    files: ["**/*.js", "**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked]
}]);