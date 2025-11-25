export type StreamSchedule = {
    segments: Awaitable<StreamSegment[]>;
    settings: {
        vacation: {
            startDate: Date;
            endDate: Date;
        }
    }
};

type StreamSegment = {
    id: string;
    startDate: Date;
    endDate: Date;
    title: string;
    cancelEndDate: Date;
    categoryId: string;
    categoryName: string;
    categoryImage: string;
    isRecurring: boolean;
}