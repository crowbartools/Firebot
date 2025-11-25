export type DateTimeHelper = {
    formatDate: (ISODate: string, format: string) => string;
    getFirstWeekDayDate: () => string;
    getLastWeekDayDate: () => string;
}