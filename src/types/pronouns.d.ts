export type Pronoun = {
    name: string;
    subject: string;
    object: string;
    singular: boolean;
};

export type UserPronoun = {
    primary: string;
    secondary?: string;
};