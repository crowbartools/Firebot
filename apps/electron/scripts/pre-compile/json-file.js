const { join } = require('./path');
const { readFileSync, writeFileSync } = require('node:fs');

const read = (path) => JSON.parse(readFileSync(path, {
    encoding: 'utf8'
}));

const write = (path, data) => {
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
}
const readPackage = (path, sanitize = true) => {
    if (!path.endsWith('package.json')) {
        path = join(path, 'package.json');
    }
    const package = read(path);
    if (sanitize === false) {
        return package;
    }
    package.scripts = {};
    package.devDependencies = {};
    return package;
}

module.exports = {
    read,
    write,
    readPackage
};