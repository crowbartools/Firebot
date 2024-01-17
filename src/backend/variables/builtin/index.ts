import arrayVariables from './array';
import numberVariables from './number';
import objectVariables from './object';
import spoofedVariables from './spoofed';
import textVariables from './text';

export default [
    ...arrayVariables,
    ...numberVariables,
    ...objectVariables,
    ...spoofedVariables,
    ...textVariables
];