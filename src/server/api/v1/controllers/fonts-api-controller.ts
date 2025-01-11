import { Request, Response } from "express";
import { FontManager } from '../../../../backend/font-manager';

export function getFontNames(req: Request, res: Response) {
    let fonts = [];
    if (FontManager.cachedFonts?.length) {
        fonts = FontManager.cachedFonts.map((f) => {
            return {
                name: f.name,
                format: f.format
            };
        });
    }
    res.json(fonts);
}

// set up font endpoint
export function getFont(req: Request, res: Response) {
    const fontName = req.params.name || null;
    if (fontName != null) {
        const font = FontManager.getFont(fontName);
        if (font) {
            const path = font.path;
            res.sendFile(path);
            return;
        }
    }
    res.status(404).send({
        status: "error",
        message: `${req.originalUrl} not found`
    });
}