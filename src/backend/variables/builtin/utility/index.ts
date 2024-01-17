import apiRead from './api-read';
import apiReadRaw from './api-read';
import convertFromJSON from './convert-from-json';
import convertToJSON from './convert-to-json';
import fileExists from './file-exists';
import fileLineCount from './file-line-count';
import fileRead from './file-read';
import quickstore from './quick-store';
import runEffect from './run-effect';

export default [
    apiRead,
    apiReadRaw,
    convertFromJSON,
    convertToJSON,
    fileExists,
    fileLineCount,
    fileRead,
    quickstore,
    runEffect
];