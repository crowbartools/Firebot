import overlayWidgetConfigManager from "../../overlay-widget-config-manager";
import { DynamicCountdownWidgetConfig, State as CountdownState } from "./countdown-dynamic";
import { EventManager } from "../../../events/event-manager";
import effectRunner from "../../../common/effect-runner";
import { Trigger } from "../../../../types/triggers";
import logger from "../../../logwrapper";

class CountdownManager {

    private intervalId: NodeJS.Timeout | null = null;

    startTimer() {
        // Start the countdown interval running every second
        this.intervalId = setInterval(() => {
            this.doTick();
        }, 1000);

        logger.debug("Countdown timer started");
    }

    private doTick() {
        const countdownConfigs = overlayWidgetConfigManager.getConfigsOfType<DynamicCountdownWidgetConfig>("firebot:countdown-dynamic");
        for (const config of countdownConfigs) {
            this.updateCountdownTime(config.id, "subtract", 1, true);
        }
    }

    updateCountdownTime(countdownConfigId: string, action: "add" | "subtract" | "set", value: number, onlyIfRunning = false, startIfPaused = false) {
        const config = overlayWidgetConfigManager.getItem(countdownConfigId) as DynamicCountdownWidgetConfig | null;
        if (!config) {
            return;
        }

        if (config.type !== "firebot:countdown-dynamic") {
            return;
        }

        const isRunning = config.state?.mode === "running";
        const canRun = config.settings?.runWhenInactive || config.active !== false;
        const hasTimeLeft = (config.state?.remainingSeconds ?? 0) > 0;
        const isSubtracting = action === "subtract";

        if ((!isRunning && onlyIfRunning) || !canRun || (isSubtracting && !hasTimeLeft)) {
            return;
        }

        let newTimeRemaining: number;
        if (action === "add") {
            newTimeRemaining = (config.state?.remainingSeconds ?? 0) + value;
        } else if (action === "subtract") {
            newTimeRemaining = (config.state?.remainingSeconds ?? 0) - value;
        } else {
            newTimeRemaining = value;
        }

        let hasCompleted = false;
        if (newTimeRemaining <= 0) {
            newTimeRemaining = 0;
            hasCompleted = true;
        }

        const newMode = (startIfPaused && !isRunning && newTimeRemaining > 0) ? "running" : config.state?.mode ?? "running";

        const newState: CountdownState = {
            ...config.state,
            remainingSeconds: newTimeRemaining,
            mode: hasCompleted ? "paused" : newMode
        };

        overlayWidgetConfigManager.setWidgetStateById(config.id, newState);

        if (hasCompleted) {
            void EventManager.triggerEvent("firebot", "dynamic-countdown-finished", {
                dynamicCountdownWidgetId: config.id,
                dynamicCountdownWidgetName: config.name
            });

            this.triggerCompleteEffects(config);
        }
    }

    private triggerCompleteEffects(config: DynamicCountdownWidgetConfig) {
        const effectList = config.settings?.onCompleteEffects;

        if (effectList == null || effectList.list == null) {
            return;
        }

        const processEffectsRequest = {
            trigger: {
                type: "overlay_widget",
                metadata: {
                    username: "Firebot",
                    dynamicCountdownWidgetId: config.id,
                    dynamicCountdownWidgetName: config.name
                }
            } as Trigger,
            effects: effectList
        };

        effectRunner.processEffects(processEffectsRequest).catch((reason) => {
            logger.error(`Error when running effects: ${reason}`);
        });
    }
}

const countdownManager = new CountdownManager();

export = countdownManager;