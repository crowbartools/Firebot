'use strict';

const fontManager = require('../../../lib/fontManager');

exports.getFontNames = function(req, res) {
    let fonts = fontManager.getInstalledFonts().map(f => {
        return {
            name: f.name,
            format: f.format
        };
    });
    res.json(fonts);
};

// set up font endpoint
exports.getFont = function (req, res) {

    let fontName = req.params.name || null;
    if (fontName != null) {
        let font = fontManager.getFont(fontName);
        if (font) {
            let path = font.path;
            res.sendFile(path);
            return;
        }
        //resourcePath = resourcePath.replace(/\\/g, "/");
        //
    }

    res.status(404).send({status: "error", message: req.originalUrl + ' not found'});
};
