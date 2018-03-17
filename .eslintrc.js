module.exports = {
    // Extend from recommened eslint rules
    // Indicated by a wrench @ https://eslint.org/docs/rules/
    "extends": "eslint:recommended",

    "parserOptions": {
        "ecmaVersion": 8,
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true
        }
    },
    
    "env": {
      "node": true,
      "browser": true,
      "es6": true
    },

    // Project specific globals
    "globals": {
        "renderWindow": true
    },
	
	"plugins": [
		"prettier"
	],

    "rules":{
		
		// Run Prettier
		"prettier/prettier": "error",

        // Deviations from https://eslint.org/docs/rules/#possible-errors
        //"no-console": 0, // Enable the use of console

        // Deviations from < https://eslint.org/docs/rules/#best-practices >
        "eqeqeq": [2, "smart"],     // No coersion unless comparing against null
        "guard-for-in": 2,          // require an if statement with for-in loops
        "no-else-return": 2,        // no 'if () { return } else { ... }
        "no-eval": 2,               // no eval()
        "no-lone-blocks": 2,        // see:
        "no-throw-literal": 2,      // must throw an error instance
        "no-unused-expressions": 2, // see:
        "no-with": 2,               // no with statements


        // Deviation from < https://eslint.org/docs/rules/#strict-mode >
        "strict": 2, // require strict mode

        // Deviation from < https://eslint.org/docs/rules/#variables >
        "no-use-before-define": 2, // require vars to be defined before use



        // Deviation from < https://eslint.org/docs/rules/#ecmascript-6 >
        "no-confusing-arrow": 2,                          // Don't use arrows functions in conditions
        "no-var": 1                                      // Warning; Use let/const instead of var
    },
	"extends": [
		"prettier"
	]
}
