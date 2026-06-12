export type QuoteAutoid = {
    _id: "__autoid__";
    seq: number;
};

export type Quote = {
    _id?: number;
    createdAt?: string;
    creator: string;
    game: string;
    originator: string;
    text: string;
};

export type FormattedQuote = Omit<Quote, "_id"> & {
    id: number;
};