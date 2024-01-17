import arrayVariables from './array';
import customVariables from './custom-vars';
import numberVariables from './number';
import objectVariables from './object';
import operandVariables from './operand';
import spoofedVariables from './spoofed';
import textVariables from './text';
import utilityVariables from './utility';

export default [
    ...arrayVariables,
    ...customVariables,
    ...numberVariables,
    ...objectVariables,
    ...operandVariables,
    ...spoofedVariables,
    ...textVariables,
    ...utilityVariables
];