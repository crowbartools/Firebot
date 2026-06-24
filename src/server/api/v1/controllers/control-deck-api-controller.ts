import type { Request, Response } from "express";
import type {
    ControlDeck,
    ControlDeckControl,
    ControlDeckControlType,
    ControlDeckControlView,
    ControlDeckView
} from "../../../../types";
import crypto from "crypto";
import { ControlDeckManager } from "../../../../backend/control-deck/control-deck-manager";
import { ControlDeckControlTypeManager } from "../../../../backend/control-deck/control-type-manager";
import { ControlDeckStateManager } from "../../../../backend/control-deck/control-deck-state-manager";
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

function resolveSettingsForView(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controlType: ControlDeckControlType<any, any> | null,
    settings: Record<string, unknown> | undefined
): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};


    if (controlType == null || settings == null) {
        return settings ?? {};
    }

    for (const param of controlType.settingsSchema ?? []) {
        const name = param.name;
        const value = settings[name];

        if (value === undefined) {
            continue;
        }

        if (param.type === "effectlist"
            || param.type === "password") {
            continue;
        }

        if (param.type === "filepath") {
            if (typeof value === "string" && value !== "") {
                const token = ResourceTokenManager.storeResourcePath(value, null);
                resolved[name] = `/resource/${token}`;
            }
            continue;
        }

        resolved[name] = value;
    }

    return resolved;
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

        let background: ControlDeckControlView["background"];
        const srcBackground = control.background;
        if (srcBackground != null) {
            if (srcBackground.type === "color" && srcBackground.color) {
                background = { type: "color", color: srcBackground.color };
            } else if (srcBackground.type === "image" && srcBackground.path) {
                if (srcBackground.source === "url") {
                    background = { type: "image", url: srcBackground.path };
                } else {
                    const token = ResourceTokenManager.storeResourcePath(srcBackground.path, null);
                    background = { type: "image", url: `/resource/${token}` };
                }
            }
        }

        const controlType = ControlDeckControlTypeManager.getControlType(control.type);

        return {
            id: control.id,
            name: control.name,
            type: control.type,
            label: control.label,
            labelFont: control.labelFont,
            labelSize: control.labelSize,
            pageId: control.pageId,
            parentId: control.parentId ?? null,
            position: control.position,
            size: control.size,
            inputs: control.inputs,
            icon,
            iconSize: control.iconSize,
            background,
            shell: controlType.shell ?? "standard",
            resolvedSettings: resolveSettingsForView(controlType, control.settings),
            state: controlType?.state != null ? ControlDeckStateManager.getControlState(control.id) : undefined
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

function parseInputValues(rawInputValues: unknown): Record<string, string | number | boolean> {
    const inputValues: Record<string, string | number | boolean> = {};
    if (rawInputValues != null && typeof rawInputValues === "object" && !Array.isArray(rawInputValues)) {
        for (const [key, value] of Object.entries(rawInputValues as Record<string, unknown>)) {
            if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
                inputValues[key] = value;
            }
        }
    }
    return inputValues;
}

async function handleInteraction(
    req: Request,
    res: Response,
    action: string,
    data: unknown
): Promise<void> {
    const enabled = SettingsManager.getSetting("ControlDeckEnabled");

    if (enabled !== true) {
        res.status(403).json({ status: "error", message: "Control Deck is disabled" });
        return;
    }

    const inputValues = parseInputValues((req.body as { inputValues?: unknown })?.inputValues);

    const success = await ControlDeckManager.handleInteraction(
        req.params.deckId,
        req.params.controlId,
        action,
        data,
        inputValues
    );
    if (!success) {
        res.status(404).json({ status: "error", message: "Control not found or has an unknown type" });
        return;
    }

    res.json({ status: "success" });
}

export async function interactWithControl(
    req: Request,
    res: Response
) {
    const body = req.body as { action?: unknown, data?: unknown };
    const action = typeof body?.action === "string" && body.action.length > 0 ? body.action : "press";
    await handleInteraction(req, res, action, body?.data ?? null);
};

