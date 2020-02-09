'use strict';

const evaluate = require('./expression-evaluate.js');

const globalHandlers = [];
const defaultArgsCheck = () => {};

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
    if (typeof handler.evaluator !== 'function') {
        throw new TypeError('evaluator must be a function');
    }

    // Add handler
    handlers.push(handler);
};

const $unuse = (handlers, handler) => {
    let index = handlers.lastIndexOf(handler);
    if (index > -1) {
        handlers.splice(index, 1);
    }
};

module.exports = class Expression {

    constructor(options) {
        this.options = options || {};
        this.handlers = [];
    }

    // registers a handler that will be used to evaluate a variable
    use(handler) {
        $use(this.handlers, handler);
    }

    // unregisters a handler
    unuse(handler) {
        $unuse(this.handlers, handler);
    }

    // validates an expression's syntax
    async validate(options) {

        // build list of variable handlers
        let handlers = this.handlers;
        if (this.options.withGlobal !== false) {
            handlers = [...handlers, ...globalHandlers];
        }

        // Validate the expression
        return await evaluate(handlers, {...this.options, ...options, evaluate: false});
    }

    // Evaluates an expression
    async evaluate(options) {

        // Build list of variable handlers
        let handlers = this.handlers;
        if (this.options.withGlobal !== false) {
            handlers = [...handlers, ...globalHandlers];
        }

        // Evaluate the expression
        return await evaluate(handlers, {...this.options, ...options});
    }


    // static methods
    // uses the globalHandlers array
    static use(handler) {
        $use(globalHandlers, handler);
    }
    static unuse(handler) {
        $unuse(globalHandlers, handler);
    }
    static async validate(options) {
        return await evaluate(globalHandlers, {...options, evaluate: false});
    }
    static async evaluate(options) {
        return await evaluate(globalHandlers, {...options, evaluate: true});
    }
};