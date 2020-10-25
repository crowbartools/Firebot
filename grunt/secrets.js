'use strict';
const fs = require('fs');
const gpgBase = 'gpg --cipher-algo AES256 --passphrase $env:PASSKEY_FOR_FIREBOT_SECRETS --pinentry-mode loopback';

module.exports = function (grunt) {
    grunt.config.merge({
        shell: {
            encryptsecrets: {
                command: `${gpgBase} --symmetric --output secrets.gpg secrets.json`
            },
            decryptsecrets: {
                command: `${gpgBase} --decrypt --output secrets.json secrets.gpg`
            }
        }
    });

    grunt.registerTask('secrets', function (action) {
        if (process.env.PASSKEY_FOR_FIREBOT_SECRETS == null) {
            throw new Error('passkey for firebot\'s secrets not found');
        }

        if (action === 'encrypt') {
            if (!fs.existsSync('../secrets.json')) {
                throw new Error('secrets.json not found');
            }

            if (fs.existsSync('../secrets.gpg')) {
                fs.unlink('../secrets.gpg');
            }

            grunt.task.run('shell:encryptsecrets');

        } else if (action === 'decrypt') {
            if (!fs.existsSync('../secrets.gpg')) {
                throw new Error('secrets.gpg not found');
            }

            if (fs.existsSync('../secrets.json')) {
                fs.unlink('../secrets.json');
            }

            grunt.task.run('shell:decryptsecrets');
        } else {
            throw new Error('unknown action');
        }
    });
};