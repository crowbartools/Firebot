"use strict";

(function() {
    const lucide = require("lucide");

    // PascalCase -> kebab-case (eg "Volume2" -> "volume-2").
    const toKebab = s => s
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
        .replace(/([a-zA-Z])([0-9])/g, "$1-$2")
        .toLowerCase();

    angular
        .module("firebotApp")
        .factory("lucideService", function() {
            const service = {};

            let cachedIcons = null;

            service.lucide = lucide;

            service.getIcons = () => {
                if (cachedIcons != null) {
                    return cachedIcons;
                }
                const seen = {};
                cachedIcons = Object.keys(lucide.icons)
                    .filter((key) => {
                        if (seen[key]) {
                            return false;
                        }
                        seen[key] = true;
                        return true;
                    })
                    .sort((a, b) => a.localeCompare(b))
                    .map(key => ({ id: toKebab(key), name: key }));
                return cachedIcons;
            };

            return service;
        });
}());
