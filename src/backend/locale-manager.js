'use strict';

const { join } = require('path');
const { readdirSync, readFileSync, statSync } = require('fs');

const logger = require("./logwrapper");

const electron = require('electron');
const workingDirectoryRoot = process.platform === 'darwin' ? process.resourcesPath : process.cwd();
const cwd = !electron.app.isPackaged ? join(electron.app.getAppPath(), "build") : workingDirectoryRoot;

const localeCache = Object.create(null);
let localeList;

module.exports.getLocaleList = () => {
    if (localeList == null) {
        const localeDir = join(cwd, `./resources/locale/`);

        const result = Object.create(null);
        let updated = false;

        const dir = readdirSync(localeDir);
        for (const entity of dir) {
            const entityPath = join(localeDir, `./${entity}`);

            try {

                const estat = statSync(entityPath);
                if (!estat.isFile()) {
                    console.log(`[locale] Not a file: ${entityPath}`);
                    continue;
                }

                const localeData = JSON.parse(readFileSync(entityPath));
                result[localeData.id] = {
                    id: localeData.id,
                    name: localeData.name,
                    display: localeData.display,
                    uri: `/locales/${entity}`
                };
                updated = true;

                logger.debug(`[locale] Added locale entry for ${localeData.id}`);

            } catch (err) {
                logger.warn(`[locale] ${entity} is invalid: ${err.message}`);
                continue;
            }
        }
        if (updated) {
            localeList = result;
        }
    }

    return localeList;
};

module.exports.getLocale = (locale) => {
    if (locale == null || locale === 'default') {
        locale = 'en-US';
    }

    if (typeof locale !== 'string') {
        // not a string
        return;
    }
    locale = locale + '';

    // validate locale name
    if (!/^[a-z]{2,}-[a-z]{2,}(?:\.json)?$/i.test(locale)) {
        logger.warn(`[locale] Invalid locale identifier: ${locale}`);
        return;
    }
    if (locale.slice(-5) !== '.json') {
        locale += '.json';
    }

    // locale not cached; attempt to read from drive
    if (!Object.hasOwn(localeCache, locale)) {
        const localePath = join(cwd, `./resources/locale/${locale}`);
        try {
            const result = JSON.parse(readFileSync(localePath, { encoding: 'utf8'}));
            locale = result.id;
            localeCache[locale] = result;
            logger.debug(`[locale]`, localeCache[locale]);

        } catch (err) {
            logger.warn(`Unable to read locale ${locale}: ${err.message}`);
            return;
        }
    }

    return localeCache[locale];
};