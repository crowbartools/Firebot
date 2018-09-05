"use strict";
/**@desc ArgumentsError class; Created when a handler's argscheck function encounters an error with the specified arguments
 * @extends Error
*/
class ArgumentsError extends Error {

    /** Create a new arguments error instance
     * @param {string} message The error message
     * @param {number} index The 0-based argument index that caused the error
     * @param {number} [cursor=0] The cursor position of where the error took place (only used internally)
     */
    constructor(message, argumentIndex, cursor) {
        super();

        // capture the current stack upto the constructor call
        Error.captureStackTrace(this, this.constructor);

        /** Message describing what is wrong with the argument
         * @name ArgumentsError#message
         * @type {string}
         */
        this.message = message;

        /** The 0-based index of the argument item that caused the error
         * @name ArgumentsError#index
         * @type {number}
         */
        this.index = argumentIndex || -1;

        /** Position of the cursor in the expression where the ArgumentsError took place
         * @name ArgumentsError#position
         * @type {number}
         * @default 0
         */
        this.position = cursor || 0;
    }
}

class ExpressionError extends Error {
    constructor(message, position) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.position = position;
    }
}

// trims leading whitespace as node doesn't support .trimStart()
const trim = str => str.replace(/^\s+/, '');

// probes
const probeText = /^(?:[^$]+|(?:\$(?=$|[\s"'`/\\[\]{}()])))+/;
const probeVar = /^\$([^$\s"'`/\\[\]{}()]+)/;
const probeQuoteArg = /^(?:[^\\"]+|(?:\\([\s\S])))/;
const probeTextArg = /^[^,\]]*/;

// handles processing and evaluating $varname and $varname[...]
async function probeVariable(handlers, expression, cursor, options) {

    // check for valid variable name token
    let token = probeVar.exec(expression);
    if (token == null) {
        return false;
    }

    let varname = token[1];
    let varargs = [];

    // consume characters that made up var name
    expression = expression.slice(token[0].length);
    let consumed = token[0].length;

    // check: arguments are supplied with the variable
    if (expression[0] === '[') {

        // consume opening bracket
        expression = expression.slice(1);
        consumed += 1;

        // set the arguments cursor position to just after the opening bracket
        let argsListCursor = cursor + consumed;

        while (true) { //eslint-disable-line no-constant-condition

            // Consume leading whitespace characters
            consumed += expression.length - (expression = trim(expression)).length;

            // Check: end of expression reached before finding a closing ]
            if (expression.length === 0) {
                throw new ExpressionError('closing bracket(]) missing', argsListCursor);
            }

            // Check: end of arguments list reached
            if (expression[0] === ']') {

                // consume closing bracket
                expression = expression.slice(1);
                consumed += 1;

                // exit loop
                break;
            }

            // Check: next token is an argument item delimiter indicating an empty argument
            if (expression[0] === ',') {

                // add the empty argument to the varargs arrays
                varargs.push('');

                // consume the delimiter
                expression = expression.slice(1);
                consumed += 1;

                // jump back to start of loop to avoid checks below
                continue;
            }

            // Check: Next token is a quoted argument
            if (expression[0] === '"') {

                // consume opening quote character
                expression = expression.slice(1);
                consumed += 1;

                // set quote cursor position to just after the opening quote
                let quoteCursor = cursor + consumed;

                // Will house the concated parts of the quoted text after accounting for character escape sequences
                let quoteText = '';

                // loop until probeQuote fails to match
                token = probeQuoteArg.exec(expression);
                while (token !== null) {

                    // Check: probe matched an escape sequence
                    if (token[1] === '\\' && token[1] === '"') {

                        // add the unescaped character to the result
                        quoteText += token[1];

                        // consume the escape sequence
                        expression = expression.slice(2);
                        consumed += 2;

                    // Treat matched text as plain text
                    } else {

                        // add text to result
                        quoteText += token[0];

                        // consume the text's characters
                        expression = expression.slice(token[0].length);
                        consumed += token[0].length;
                    }

                    token = probeQuoteArg.exec(expression);
                }

                // Check: quote is closed
                if (expression[0] !== '"') {
                    throw new ExpressionError('closing quote(") missing', quoteCursor);
                }

                // add the quoted argument's text to the arguments list
                varargs.push(quoteText);

            // check: token is a variable expression
            } else if ((token = await probeVariable(handlers, expression, cursor + consumed, options)) !== false) {

                // add the result of the variable to the args list
                varargs.push(token.value);

                // consume the variable token's characters
                expression = expression.slice(token.consumed);
                consumed += token.consumed;

            // check: token is plain-text
            } else if ((token = probeTextArg.exec(expression)) != null) {

                // add the plain-text token to the args list
                varargs.push(token[0]);

                // consume the plain-text token's characters
                expression = expression.slice(token[0].length);
                consumed += token[0].length;

            // All checks failed
            } else {
                throw new ExpressionError('unexpected character', cursor + consumed);
            }

            /* Made it here, meaning an argument item token was consumed */

            // consume leading whitespace
            consumed += expression.length - (expression = trim(expression)).length;

            // Check: illegal character after token
            if (expression[0] !== "," && expression[0] !== ']') {
                throw new ExpressionError('unexpected character', cursor + consumed);
            }
        }
    } // done processing args list



    // Apply options.transform function to the varname
    if (typeof options.transform === 'function') {
        varname = options.transform(varname);
    }

    let handler = handlers.find(handler => {
        if (typeof handler.handle === 'string') {
            return handler.handle === varname;
        }
        return handler.handle(varname);
    });

    if (!handler) {
        throw new ExpressionError('unknown variable', cursor);
    }

    // check trigger stuff
    if (handler.triggers) {

        let handleTrigger = handler.triggers[options.triggers.type];
        if (handleTrigger == null || handleTrigger === false) {
            throw new ExpressionError('variable does not support this trigger type', cursor);
        }

        if (Array.isArray(handleTrigger)) {
            if (!handleTrigger.some(id => id === options.trigger.id)) {
                throw new ExpressionError('variable does not support this trigger type', cursor);
            }
        }

    }

    // should throw an error for invalid args
    try {
        await handler.argscheck(...varargs);

    // catch the error and rethrow it with the cursor position
    } catch (e) {
        throw new ArgumentsError(e.message, e.index, cursor);
    }

    // no evaluation
    if (options.evaluate === false) {
        return {
            value: '',
            consumed: consumed
        };
    }

    // call the evaluator function
    let result = await handler.evaluate(options.metadata, ...varargs);
    return {
        value: result,
        consumed: consumed
    };
}


async function processExpression(handlers, expression, options) {
    if (!Array.isArray(handlers)) {
        throw new TypeError('handlers list not an array');
    }

    if (options.trigger == null) {
        throw new ArgumentsError('no trigger defined in options');
    }

    let cursor = 0;
    let result = '';

    while (expression) {

        // Check: next token is an escaped '$'
        if (expression.slice(0, 2) === '$$') {
            result += '$';

            // consume the escape characters
            expression = expression.slice(2);
            cursor += 2;

            // move on to next token
            continue;
        }

        // Check: next token is plain text
        let token = probeText.exec(expression);
        if (token != null) {
            result += token[0];

            // consume text characters
            expression = expression.slice(token[0].length);
            cursor += token[0].length;

            // move on to next token
            continue;
        }

        // check: next token is a variable
        token = await probeVariable(handlers, expression, cursor, options);
        if (token !== false) {
            result += token.value;

            // consume variable characters
            expression = expression.slice(token.consumed);
            cursor += token.consumed;

            // move on to next token
            continue;
        }

        // checks failed, raise error
        throw new ExpressionError('unexpected token', cursor);
    }

    return result;
}

module.exports = {
    processExpression: processExpression,
    ExpressionError: ExpressionError,
    ArgumentsError: ArgumentsError
};