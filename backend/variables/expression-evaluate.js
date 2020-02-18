'use strict';

const {
    ExpressionError,
    ExpressionSyntaxError,
    ExpressionVariableError,
    ExpressionArgumentsError
} = require('./expression-errors.js');

// Define probeing regexes
const probeText = /^((?:[^$\\]|(?:\\[$\\])|(?:\\(?![$\\]))|(?:\$(?![a-z][a-z\d])))+)/;
const probeArg = /^\s*((?:[^"$\\,\] ]|(?:\\[\\"\]$])|(?:\\(?![\\"\]$]))|(?: +(?=$|[^ \],]))|(?:\$(?![a-z][a-z\d])))+)/;
const probeQuote = /^"((?:[^\\"]|\\[\\"]|\\(?!\\"))+)"/;
const probeVar = /^\s*\$([a-z][a-z\d]+)/i;

function text(expression, cursor = 0, isArg = false) {
    let token, result;

    while (expression) {

        // Probe for unquoted text
        token = (isArg ? probeArg : probeText).exec(expression);
        if (token != null) {

            // Unescape characters
            let value = token[1].replace(/\\(["$\\])/g, '$1');

            // Add to text to result
            if (result == null) {
                result = value;
            } else {
                result += value;
            }

            // Consume text from expression and update cursor
            expression = expression.slice(token[0].length);
            cursor += token[0].length;

            // Attempt to consume more text
            continue;
        }

        // Quoted text probe
        if (isArg && expression[0] === '"') {

            // Probe for quoted text
            token = probeQuote.exec(expression);

            // Mix matched quptes
            if (token == null) {
                throw new ExpressionError('mixmatched quotes', cursor);
            }

            // Unescape characters
            let value = token[1].replace(/\\(["$\\])/g, '$1');

            if (result == null) {
                result = value;
            } else {
                result += value;
            }

            // Consume text from expression and update cursor
            expression = expression.slice(token[0].length);
            cursor += token[0].length;

            // Attempt to consume more text
            continue;
        }

        // text is not the next token
        break;
    }

    // Text was consumed
    if (result != null) {
        return { result, cursor, expression};
    }
}

async function variable(handlers, expression, options, cursor = 0) {

    // Probe: next token in expression is a variable
    let token = probeVar.exec(expression);
    if (token == null) {
        return;
    }

    // Consume characters that make up the varname
    expression = expression.slice(token[0].length);
    cursor += token[0].length;

    // Extract the varname
    let varname = token[1],
        varargs = [],
        argValue = '';

    // Variable contains argument list
    if (expression[0] === '[') {

        let argStart = cursor;

        // Consume opening bracket
        expression = expression.slice(1);
        cursor += 1;

        // eslint-disable-next-line no-constant-condition
        while (true) {

            // trim leading whitespace
            let expressionTrim = expression.replace(/^ +/g, '');

            // Cunsume whitespace
            cursor += expression.length - expressionTrim.length;
            expression = expressionTrim;

            if (expression.length === 0) {
                throw new ExpressionSyntaxError('missing closing bracket(])', argStart);
            }

            // Probe: Next token is the end of arguments
            if (expression[0] === ']') {

                // Consume closing bracket
                expression = expression.slice(1);
                cursor += 1;

                // add argument to arguments list
                varargs.push(argValue);
                argValue = '';

                // exit loop
                break;
            }

            // Probe: Next token is an argument delimiter
            if (expression[0] === ',') {

                // Consume delimiter
                expression = expression.slice(1);
                cursor += 1;

                // add argValue to arguments list
                varargs.push(argValue);
                argValue = '';

                // Move on to next token
                continue;
            }

            // Probe: Next token is text
            token = text(expression, cursor, true);
            if (token != null) {
                argValue += token.result;
                expression = token.expression;
                cursor = token.cursor;

                // Move on to next token
                continue;
            }

            // Probe: Next token is a varaible
            token = await variable(handlers, expression, options, cursor);
            if (token != null) {
                argValue += token.result;
                expression = token.expression;
                cursor = token.cursor;

                // Move on to next token
                continue;
            }

            // All probes failed
            throw new ExpressionSyntaxError('Invalid character', cursor);
        }
    }

    // Transform var name if applicable
    if (typeof options.transform === 'function') {
        varname = options.transform(varname);
    }

    // Attempt to retrieve the handler for the var
    let handler = handlers.find(handler => {
        if (typeof handler.handle === 'string') {
            return handler.handle === varname;
        }
        return handler.handle(varname);
    });

    // varname not registered
    if (!handler) {
        throw new ExpressionVariableError('unknown variable', cursor, varname);
    }

    // Check if varname exists in the trigger scope
    if (handler.triggers) {
        let trigger = handler.triggers[options.trigger.type],
            display = options.trigger.type ? options.trigger.type.toLowerCase() : "unknown trigger";

        if (trigger == null || trigger === false) {
            throw new ExpressionVariableError(`${varname} does not support being triggered by: ${display}`, cursor, varname);
        }

        if (Array.isArray(trigger)) {
            if (!trigger.some(id => id === options.trigger.id)) {
                throw new ExpressionVariableError(`${varname} does not support this specific trigger type: ${display}`, cursor, varname);
            }
        }
    }

    // The expression is just having its syntax checked
    if (options.evaluate === false) {
        return {result: '', cursor, expression};
    }


    // Validate args:
    try {
        await handler.argsCheck(...varargs);
    } catch (err) {
        throw new ExpressionArgumentsError(err.message, err.cursor, err.index, err.varname);
    }

    // Evaluate variable
    return {
        result: await handler.evaluator(options.metadata, ...varargs),
        cursor,
        expression
    };
}

module.exports = async function evaluate(handlers, options) {

    // validate handlers list
    if (!Array.isArray(handlers)) {
        throw new TypeError('Handlers list not an array');
    }

    // validate options.expression
    if (options.expression == null) {
        throw new ExpressionError('expression not specified');
    }
    if (typeof options.expression !== 'string') {
        throw new ExpressionError('expression must be a string');
    }

    // validate options.trigger
    if (options.trigger == null) {
        throw new ExpressionArgumentsError('No trigger defined in options');
    }

    let expression = options.expression,
        cursor = 0,
        result = '',
        token;

    while (expression) {

        // Probe: text
        token = text(expression);
        if (token) {
            result += token.result;
            cursor = token.cursor;
            expression = token.expression;
            continue;
        }

        // Probe: variable
        token = await variable(handlers, expression, options);
        if (token) {
            result += token.result;
            cursor = token.cursor;
            expression = token.expression;
            continue;
        }

        // Probes failed
        throw new ExpressionSyntaxError('unexpected token', cursor, expression[0]);
    }

    return result;
};