import type { SnakeCased } from "../../../../../types";
import type { TwitchApi } from "..";
import type { CustomReward, ImageSet } from "./channel-rewards";
import { ApiResourceBase } from "./api-resource-base";

export type CustomPowerUp = Omit<CustomReward, "cost" | "shouldRedemptionsSkipRequestQueue"> & {
    bits: number;
};

export class TwitchPowerUpsApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    /**
     * Get an array of custom power-ups for the streamer's channel.
     */
    async getCustomPowerUps(): Promise<CustomPowerUp[]> {
        return this.fetchCustomPowerUps();
    }

    /**
     * Get a specific custom power-up by its ID.
     * @param powerUpId The ID of the custom power-up to retrieve.
     * @returns The custom power-up with the specified ID, or null if not found.
     */
    async getCustomPowerUpById(powerUpId: string): Promise<CustomPowerUp | null> {
        const powerUps = await this.fetchCustomPowerUps(powerUpId);
        if (powerUps?.length) {
            return powerUps[0];
        }
        return null;
    }

    private async fetchCustomPowerUps(id?: string): Promise<CustomPowerUp[]> {
        try {
            const query: Record<string, string> = {
                // eslint-disable-next-line camelcase
                broadcaster_id: this.accounts.streamer.userId
            };

            if (id) {
                query.id = id;
            }

            const response = await this.streamerClient?.callApi<{ data: ApiCustomPowerUp[] }>({
                type: "helix",
                method: "GET",
                url: "bits/custom_power_ups",
                query
            });

            if (!response?.data) {
                return null;
            }

            return response.data.map(p => this.mapApiCustomPowerUp(p));
        } catch (err) {
            this.logger.debug(`Failed to get twitch custom power-ups: ${(err as Error).message}`);
            return null;
        }
    }

    private mapApiCustomPowerUp(apiCustomPowerUp: ApiCustomPowerUp): CustomPowerUp {
        const getImageUrl = (scale: 1 | 2 | 4): string => {
            const urlProp = `url_${scale}x` as const;
            return apiCustomPowerUp.image?.[urlProp] ?? apiCustomPowerUp.default_image[urlProp];
        };

        const image: ImageSet = {
            url1x: getImageUrl(1),
            url2x: getImageUrl(2),
            url4x: getImageUrl(4)
        };

        return {
            broadcasterId: apiCustomPowerUp.broadcaster_id,
            broadcasterLogin: apiCustomPowerUp.broadcaster_login,
            broadcasterName: apiCustomPowerUp.broadcaster_name,
            id: apiCustomPowerUp.id,
            title: apiCustomPowerUp.title,
            prompt: apiCustomPowerUp.prompt,
            bits: apiCustomPowerUp.bits,
            image: image,
            defaultImage: image,
            backgroundColor: apiCustomPowerUp.background_color,
            isEnabled: apiCustomPowerUp.is_enabled,
            isUserInputRequired: apiCustomPowerUp.is_user_input_required,
            maxPerStreamSetting: {
                isEnabled: apiCustomPowerUp.max_per_stream_setting.is_enabled,
                maxPerStream: apiCustomPowerUp.max_per_stream_setting.max_per_stream
            },
            maxPerUserPerStreamSetting: {
                isEnabled: apiCustomPowerUp.max_per_user_per_stream_setting.is_enabled,
                maxPerUserPerStream: apiCustomPowerUp.max_per_user_per_stream_setting.max_per_user_per_stream
            },
            globalCooldownSetting: {
                isEnabled: apiCustomPowerUp.global_cooldown_setting.is_enabled,
                globalCooldownSeconds: apiCustomPowerUp.global_cooldown_setting.global_cooldown_seconds
            },
            isPaused: apiCustomPowerUp.is_paused,
            isInStock: apiCustomPowerUp.is_in_stock,
            cooldownExpiresAt: apiCustomPowerUp.cooldown_expires_at
                ? new Date(apiCustomPowerUp.cooldown_expires_at)
                : null
        };
    }
}

type ApiCustomPowerUp = SnakeCased<CustomPowerUp>;