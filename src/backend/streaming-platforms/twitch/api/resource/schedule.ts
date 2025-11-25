import { ApiResourceBase } from './api-resource-base';
import type { TwitchApi } from "../";
import { HelixCreateScheduleSegmentData, HelixSchedule, HelixScheduleSegment, HelixScheduleSettingsUpdate } from '@twurple/api';
import { StreamSchedule } from "../../../../../types/stream-schedule";

export class TwitchScheduleApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    /**
     * Retrieves the stream schedule for the streamer.
     */
    async getStreamSchedule(): Promise<StreamSchedule> {
        try {
            const streamerId = this.accounts.streamer.userId;

            const schedule = await this.streamerClient.schedule.getSchedule(streamerId);

            return this.mapStreamScheduleData(schedule.data);
        } catch (error) {
            this.logger.error(`Failed to get stream schedule: ${(error as Error).message}`);
            return null;
        }
    }

    private mapStreamScheduleData(schedule: HelixSchedule): StreamSchedule {
        return {
            segments: schedule.segments.map(async segment => {
                return {
                    id: segment.id,
                    startDate: segment.startDate,
                    endDate: segment.endDate,
                    title: segment.title,
                    cancelEndDate: segment.cancelEndDate,
                    categoryId: segment.categoryId,
                    categoryName: segment.categoryName,
                    categoryImage: (await this.streamerClient.games.getGameById(segment.categoryId)).boxArtUrl,
                    isRecurring: segment.isRecurring
                }
            }),
            settings: {
                vacation: {
                    startDate: schedule.vacationStartDate,
                    endDate: schedule.vacationEndDate
                }
            }
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