import { ApiResourceBase } from './api-resource-base';
import type { TwitchApi } from "../";
import { HelixCreateScheduleSegmentData, HelixSchedule, HelixScheduleSegment, HelixScheduleSettingsUpdate } from '@twurple/api';

export class TwitchScheduleApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    /**
     * Retrieves the stream schedule for the streamer.
     */
    async getStreamSchedule(): Promise<HelixSchedule> {
        try {
            const streamerId = this.accounts.streamer.userId;

            const schedule = await this.streamerClient.schedule.getSchedule(streamerId);

            return schedule.data;
        } catch (error) {
            this.logger.error(`Failed to get stream schedule: ${(error as Error).message}`);
            return null;
        }
    }

    /**
     * Updates the settings for the streamer's stream schedule.
     */
    async updateStreamScheduleSettings(settings: HelixScheduleSettingsUpdate): Promise<void> {
        try {
            const streamerId = this.accounts.streamer.userId;

            await this.streamerClient.schedule.updateScheduleSettings(streamerId, settings);
        } catch (error) {
            this.logger.error(`Failed to update stream schedule settings: ${(error as Error).message}`);
            return null;
        }
    }

    /**
     * Creates a new segment in the streamer's stream schedule.
     */
    async createStreamScheduleSegment(data: HelixCreateScheduleSegmentData): Promise<HelixScheduleSegment> {
        try {
            const streamerId = this.accounts.streamer.userId;

            const scheduleSegment = await this.streamerClient.schedule.createScheduleSegment(streamerId, data);

            return scheduleSegment;
        } catch (error) {
            this.logger.error(`Failed to create new stream schedule segment: ${(error as Error).message}`);
            return null;
        }
    }

    /**
     * Updates a segment in the streamer's stream schedule.
     */
    async updateStreamScheduleSegment(segmentId: string, data: HelixCreateScheduleSegmentData): Promise<HelixScheduleSegment> {
        try {
            const streamerId = this.accounts.streamer.userId;

            const scheduleSegment = await this.streamerClient.schedule.updateScheduleSegment(streamerId, segmentId, data);

            return scheduleSegment;
        } catch (error) {
            this.logger.error(`Failed to update stream schedule segment: ${(error as Error).message}`);
            return null;
        }
    }

    /**
     * Deletes a segment in the streamer's stream schedule.
     */
    async deleteStreamScheduleSegment(segmentId: string): Promise<HelixScheduleSegment> {
        try {
            const streamerId = this.accounts.streamer.userId;

            await this.streamerClient.schedule.deleteScheduleSegment(streamerId, segmentId);
        } catch (error) {
            this.logger.error(`Failed to delete stream schedule segment: ${(error as Error).message}`);
            return null;
        }
    }
}