export type Currency = {
    id: string;
    name: string;
    active: boolean;
    limit: number;
    transfer: "Allow" | "Disallow";
    interval: number;
    payout: number;

    /** Offline payout */
    offline?: number | string;

    /** Maps user role IDs to the amount of bonus payout they receive. */
    bonus: Record<string, number>;
};