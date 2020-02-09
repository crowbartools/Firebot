'use strict';
class ExpressionError extends Error {
    constructor(message, position) {
        super(message);

        Error.captureStackTrace(this, this.constructor);
        this.message = message;
        this.position = position || 0;
    }
}
class ExpressionSyntaxError extends ExpressionError {
    constructor(message, position, character) {
        super(message, position);

        Error.captureStackTrace(this, this.constructor);
        this.character = character;
    }
}
class ExpressionVariableError extends ExpressionError {
    constructor(message, position, varname) {
        super(message, position);

        Error.captureStackTrace(this, this.constructor);
        this.varname = varname;
    }
}
class ExpressionArgumentsError extends ExpressionError {
    constructor(message, position, index, varname) {
        super(message, position);

        Error.captureStackTrace(this, this.constructor);
        this.index = index || -1;
        this.varname = varname;
    }
}
module.exports = {ExpressionError, ExpressionSyntaxError, ExpressionVariableError, ExpressionArgumentsError };