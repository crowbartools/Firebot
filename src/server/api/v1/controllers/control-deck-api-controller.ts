import type { Request, Response } from "express";
import type { ControlDeck, ControlDeckControl, ControlDeckControlView, ControlDeckView } from "../../../../types";
import crypto from "crypto";
import { ControlDeckManager } from "../../../../backend/control-deck/control-deck-manager";
import { ResourceTokenManager } from "../../../../backend/resource-token-manager";
import { SettingsManager } from "../../../../backend/common/settings-manager";

function controlDeckPinMatches(providedPin: unknown): boolean {
    const pin = SettingsManager.getSetting("ControlDeckPin");

    // No PIN configured, allow access
    if (pin == null || pin === "") {
        return true;
    }

    if (typeof providedPin !== "string" || providedPin.length === 0) {
        return false;
    }

    const expected = Buffer.from(pin);
    const actual = Buffer.from(providedPin);

    if (expected.length !== actual.length) {
        return false;
    }

    return crypto.timingSafeEqual(expected, actual);
}

function mapControlDeckDeckView(deck: ControlDeck): ControlDeckView {
    const controls: ControlDeckControlView[] = (deck.controls ?? []).map((control: ControlDeckControl) => {
        let icon: ControlDeckControlView["icon"];

        const srcIcon = control.icon;
        if (srcIcon != null) {
            if (srcIcon.type === "glyph") {
                icon = { type: "glyph", name: srcIcon.name, color: srcIcon.color };
            } else if (srcIcon.type === "emoji" && srcIcon.emoji != null && srcIcon.emoji !== "") {
                icon = { type: "emoji", emoji: srcIcon.emoji };
            } else if (srcIcon.type === "image" && srcIcon.path != null && srcIcon.path !== "") {
                if (srcIcon.source === "url") {
                    icon = { type: "image", url: srcIcon.path };
                } else {
                    const token = ResourceTokenManager.storeResourcePath(srcIcon.path, null);
                    icon = { type: "image", url: `/resource/${token}` };
                }
            }
        }

        return {
            id: control.id,
            name: control.name,
            type: control.type,
            pageId: control.pageId,
            parentId: control.parentId ?? null,
            backgroundColor: control.backgroundColor,
            position: control.position,
            size: control.size,
            autoReturn: control.autoReturn,
            inputs: control.inputs,
            icon
        };
    });

    return {
        ...deck,
        controls
    };
}

export function getControlDeckSettings(
    _req: Request,
    res: Response
) {
    const enabled = SettingsManager.getSetting("ControlDeckEnabled");
    const pin = SettingsManager.getSetting("ControlDeckPin");
    const orientationMode = SettingsManager.getSetting("ControlDeckOrientationMode") ?? "dynamic";
    const defaultDeckId = SettingsManager.getSetting("ControlDeckDefaultDeckId") ?? null;
    res.json({
        enabled: enabled === true,
        pinRequired: pin != null && pin !== "",
        orientationMode: orientationMode,
        defaultDeckId
    });
}

export function pinMiddleware(req: Request, res: Response, next: () => void) {
    const providedPin = req.get("x-control-deck-pin") ?? req.query.pin;
    if (!controlDeckPinMatches(providedPin)) {
        res.status(401).json({ status: "error", message: "Invalid or missing PIN" });
        return;
    }
    next();
};

export function getDecks(
    _req: Request,
    res: Response
) {
    const enabled = SettingsManager.getSetting("ControlDeckEnabled");

    if (enabled !== true) {
        res.status(403).json({ status: "error", message: "Control Deck is disabled" });
        return;
    }

    const decks = ControlDeckManager.getAllItems().map(d => ({
        id: d.id,
        name: d.name
    }));
    res.json(decks);
};

export function getDeck(
    req: Request,
    res: Response
) {
    const enabled = SettingsManager.getSetting("ControlDeckEnabled");

    if (enabled !== true) {
        res.status(403).json({ status: "error", message: "Control Deck is disabled" });
        return;
    }

    const deck = ControlDeckManager.getItem(req.params.deckId);
    if (deck == null) {
        res.status(404).json({ status: "error", message: "Deck not found" });
        return;
    }

    res.json(mapControlDeckDeckView(deck));
};

export function pressControl(
    req: Request,
    res: Response
) {
    const enabled = SettingsManager.getSetting("ControlDeckEnabled");

    if (enabled !== true) {
        res.status(403).json({ status: "error", message: "Control Deck is disabled" });
        return;
    }

    // Only accept a flat object of primitive input values
    const inputValues: Record<string, string | number | boolean> = {};
    const rawInputValues = (req.body as { inputValues?: unknown })?.inputValues;
    if (rawInputValues != null && typeof rawInputValues === "object" && !Array.isArray(rawInputValues)) {
        for (const [key, value] of Object.entries(rawInputValues as Record<string, unknown>)) {
            if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
                inputValues[key] = value;
            }
        }
    }

    const success = ControlDeckManager.triggerControl(req.params.deckId, req.params.controlId, inputValues);
    if (!success) {
        res.status(404).json({ status: "error", message: "Control not found or has no effects" });
        return;
    }

    res.json({ status: "success" });
};

