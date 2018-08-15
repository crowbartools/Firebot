"use strict";
const {processExpression, ExpressionError, ArgumentsError} = require('./expression-processor.js');

const globalHandlers = [];
const defaultArgsCheck = () => true;

/** @private @function useFactory Abstraction for adding variable handlers to
 *                                the global or instance handler list
 * @param {array} handlers handlers list to add the handler to
 * @param {HandleFn|String} handles
 * @param {ArgsCheckFn|String} argsCheck
 * @param {EvaluatorFn|String} evaluator
 */
const $use = (handlers, handle, argsCheck, evaluate) => {

    // validate: handles argument
    if (
        typeof handle !== 'function' &&
        typeof handle !== 'string'
    ) {
        throw new TypeError('handle must be a string or function');
    }

    // argsCheck not defined; use default
    if (argsCheck == null) {
        argsCheck = defaultArgsCheck;

    // validate: argsCheck argument
    } else if (typeof argsCheck !== 'function') {
        throw new TypeError('argumentsValidator not a function');
    }

    // validate: evaluator
    if (typeof evaluate !== 'function') {
        throw new TypeError('evaluator must be a function');
    }

    // due to the lack of a reverse-order findIndex method for arrays, items are
    // added to the start of the array and .findIndex is used when searching so
    // that that newer items are checked before older items
    handlers.unshift({
        handle: handle,
        argscheck: argsCheck,
        evaluate: evaluate
    });
};

/** @private @function unuseFactory Abstraction for removing variable handlers
 *                                  from either the global or an instance list
 * @param {array} handlers handlers list to remove the handler from
 * @param {HandleFn|String} handle
 * @param {ArgsCheckFn|String} argsCheck
 * @param {EvaluatorFn|String} evaluator
 */
const $unuse = (handlers, handle, argsCheck, evaluate) => {

    // validate: validator
    if (
        typeof handle !== 'function' &&
        typeof handle !== 'string'
    ) {
        throw new TypeError('handle must be a string or function');
    }

    // argsCheck not defined; use default
    if (argsCheck == null) {
        argsCheck = defaultArgsCheck;

    // validate: argsCheck argument
    } else if (typeof argsCheck !== 'function') {
        throw new TypeError('argumentsValidator must be a function when specified');
    }

    // validate: evaluator argument
    if (typeof evaluate !== 'function') {
        throw new TypeError('evaluator must be a function');
    }

    // Attempt to find first matching index
    let index = handlers.findIndex(val => val.handle === handle && val.argscheck === argsCheck && val.evaluate === evaluate);
    if (index > -1) {

        // remove the handler
        handlers.splice(index, 1);
    }
};


class Expression {

    /** @static @type {UseFn} Adds a global variable handler*/
    static use(handle, argsCheck, evaluator) {
        if (arguments.length < 3) {
            $use(globalHandlers, handle, undefined, argsCheck);
        } else {
            $use(globalHandlers, handle, argsCheck, evaluator);
        }
    }

    /** @static @type {UnuseFn} Removes a global variable handler*/
    static unuse(handle, argsCheck, evaluator) {
        if (arguments.length < 3) {
            $unuse(globalHandlers, handle, undefined, argsCheck);
        } else {
            $unuse(globalHandlers, handle, argsCheck, evaluator);
        }
    }

    /** @static @type {ExpressionFn} Validates the expression using the global handlers list*/
    static async validate(expression, metadata) {
        return await processExpression(globalHandlers, expression, {
            metadata: metadata,
            evaluate: false
        });
    }

    /** @static @type {ExpressionFn} Evaluates the expression using the global handlers list*/
    static async evaluate(expression, metadata) {
        return await processExpression(globalHandlers, expression, {
            metadata: metadata
        });
    }

    /**@constructor Creates a new Expression Evaluator instance */
    constructor(options) {
        this.options = options || {};
        this.handlers = [];
    }

    /** @type {UseFn} Adds a instance variable handler*/
    use(handle, argsCheck, evaluator) {
        if (arguments.length < 3) {
            $use(this.handlers, handle, undefined, argsCheck);
        } else {
            $use(this.handlers, handle, argsCheck, evaluator);
        }
    }

    /** @type {UnuseFn} Removes an instance variable handler*/
    unuse(handle, argsCheck, evaluator) {
        if (arguments.length < 3) {
            $unuse(this.handlers, handle, undefined, argsCheck);
        } else {
            $unuse(this.handlers, handle, argsCheck, evaluator);
        }
    }

    /** @type {ExpressionFn} Validates the expression using instance and (if applicable) global handlers list*/
    async validate(expression, metadata) {

        // build handlers list
        let handlers = this.handlers;
        if (this.options.withGlobal !== false) {
            handlers = handlers.concat(globalHandlers);
        }

        // call expression processor
        return await processExpression(handlers, expression, {
            metadata: metadata,
            transform: this.options.transform,
            evaluate: false // false indicating that variables shouldn't be evaluated check verfied
        });
    }

    /** @type {ExpressionFn} Evaluates the expression using instance and (if applicable) global handlers list*/
    async evaluate(expression, metadata) {

        // build handlers list
        let handlers = this.handlers;
        if (this.options.withGlobal !== false) {
            handlers = handlers.concat(globalHandlers);
        }

        // call expression processor
        return await processExpression(handlers, expression, {
            metadata: metadata,
            transform: this.options.transform
        });
    }
}

// Expose Custom errors as static properties
Expression.ExpressionError = ExpressionError;
Expression.ArgumentsError = ArgumentsError;

// Return the class
module.exports = Expression;