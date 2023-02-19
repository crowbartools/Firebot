const { posix, win32 } = require('node:path');

let basename, join, normalize, parse, resolve;

if (process.platform) {
    basename = win32.basename;
    join = win32.join;
    normalize = win32.normalize;
    parse = win32.parse;
    resolve = win32.resolve;
} else {
    basename = posix.basename;
    join = posix.join;
    normalize = posix.normalize;
    parse = posix.parse;
    resolve = posix.resolve;
}

module.exports = {
    basename,
    join: (...args) => normalize(join(...args)),
    normalize,
    parse,
    resolve: (...args) => normalize(resolve(...args))
};
