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
const $use = (handlers, handler) => {

    // validate: handles argument
    if (
        typeof handler.handle !== 'function' &&
        typeof handler.handle !== 'string'
    ) {
        throw new TypeError('handle must be a string or function');
    }

    // argsCheck not defined; use default
    if (handler.argsCheck == null) {
        handler.argsCheck = defaultArgsCheck;

    // validate: argsCheck argument
    } else if (typeof handler.argsCheck !== 'function') {
        throw new TypeError('argumentsValidator not a function');
    }

    // validate: evaluator
    if (typeof handler.evaluate !== 'function') {
        throw new TypeError('evaluator must be a function');
    }

    // due to the lack of a reverse-order findIndex method for arrays, items are
    // added to the start of the array and .findIndex is used when searching so
    // that that newer items are checked before older items
    handlers.unshift(handler);
};

/** @private @function unuseFactory Abstraction for removing variable handlers
 *                                  from either the global or an instance list
 * @param {array} handlers handlers list to remove the handler from
 * @param {HandleFn|String} handle
 * @param {ArgsCheckFn|String} argsCheck
 * @param {EvaluatorFn|String} evaluator
 */
const $unuse = (handlers, handler) => {

    // validate: validator
    if (
        typeof handler.handle !== 'function' &&
        typeof handler.handle !== 'string'
    ) {
        throw new TypeError('handle must be a string or function');
    }

    // argsCheck not defined; use default
    if (handler.argsCheck == null) {
        handler.argsCheck = defaultArgsCheck;

    // validate: argsCheck argument
    } else if (typeof handler.argsCheck !== 'function') {
        throw new TypeError('argumentsValidator must be a function when specified');
    }

    // validate: evaluator argument
    if (typeof handler.evaluate !== 'function') {
        throw new TypeError('evaluator must be a function');
    }

    // Attempt to find first matching index
    let index = handlers.findIndex(val => val === handler);
    if (index > -1) {

        // remove the handler
        handlers.splice(index, 1);
    }
};


class Expression {

    /** @static @type {UseFn} Adds a global variable handler*/
    static use(handler) {
        $use(globalHandlers, handler);
    }

    /** @static @type {UnuseFn} Removes a global variable handler*/
    static unuse(handler) {
        $unuse(globalHandlers, handler);
    }

    /** @static @type {ExpressionFn} Validates the expression using the global handlers list*/
    static async validate(options) {
        return await processExpression(globalHandlers, options.expression, {
            metadata: options.metadata,
            trigger: options.trigger,
            evaluate: false
        });
    }

    /** @static @type {ExpressionFn} Evaluates the expression using the global handlers list*/
    static async evaluate(options) {
        return await processExpression(globalHandlers, options.expression, {
            metadata: options.metadata,
            trigger: options.trigger
        });
    }

    /**@constructor Creates a new Expression Evaluator instance */
    constructor(options) {
        this.options = options || {};
        this.handlers = [];
    }

    /** @type {UseFn} Adds a instance variable handler*/
    use(handler) {
        $use(this.handlers, handler);
    }

    /** @type {UnuseFn} Removes an instance variable handler*/
    unuse(handler) {
        $unuse(this.handlers, handler);
    }

    /** @type {ExpressionFn} Validates the expression using instance and (if applicable) global handlers list*/
    async validate(options) {

        // build handlers list
        let handlers = this.handlers;
        if (this.options.withGlobal !== false) {
            handlers = handlers.concat(globalHandlers);
        }

        // call expression processor
        return await processExpression(handlers, options.expression, {
            metadata: options.metadata,
            transform: this.options.transform,
            trigger: options.trigger,
            evaluate: false // false indicating that variables shouldn't be evaluated check verfied
        });
    }

    /** @type {ExpressionFn} Evaluates the expression using instance and (if applicable) global handlers list*/
    async evaluate(options) {

        // build handlers list
        let handlers = this.handlers;
        if (this.options.withGlobal !== false) {
            handlers = handlers.concat(globalHandlers);
        }

        // call expression processor
        return await processExpression(handlers, options.expression, {
            metadata: options.metadata,
            trigger: options.trigger,
            transform: this.options.transform
        });
    }
}

// Expose Custom errors as static properties
Expression.ExpressionError = ExpressionError;
Expression.ArgumentsError = ArgumentsError;

// Return the class
module.exports = Expression;