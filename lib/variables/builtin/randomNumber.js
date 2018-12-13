"use strict";

const util = require("../../utility");

const model = {
    definition: {
        handle: "randomNumber",
        usage: "randomNumber[min, max]",
        description: "Get a random number between the given range."
    },
    evaluator: (_, min, max) => {

        //let internalMin = max ? min : 1;
        //let internalMax = max ? max : min;
        console.log("******^*^*^*&*&^*^*&^*&^*&^*");
        console.log(min, max);

        return util.getRandomInt(min, max);
    },
    argsCheck: (min, max) => {

        /*if (min == null || isNaN(min)) {
            throw new SyntaxError("A valid min number needs to be specified!");
        }

        if (max != null && (isNaN(max) || parseInt(max) < parseInt(min))) {
            throw new SyntaxError("'max' needs to be a number thats larger than 'min.");
        }*/

        return true;
    }
};

module.exports = model;
