import builtinVariables from './builtin/index';

// import * as manager from './replace-variable-manager';

const manager = require('./replace-variable-manager');

const oldVariableLoader = require('./builtin-variable-loader');

export const loadReplaceVariables = () => {
    for (const definition of builtinVariables) {
        manager.registerReplaceVariable(definition);
    }
    oldVariableLoader.loadReplaceVariables();
};



