import { TypedEmitter } from "tiny-typed-emitter";
import eventManager from "../../../events/EventManager";
import logger from "../../../logwrapper";

type ExtraLifeDonation = {
    displayName: string;
    participantID: number;
    amount: number;
    donorID: string;
    avatarImageURL: string;
    createdDateUTC: string;
    eventID: number;
    teamID: number;
    donationID: string;
    incentiveID: string;
    message: string;
};

interface ConnectionEvents {
    connected: VoidFunction;
    disconnected: VoidFunction;
}

class ExtraLifePollService extends TypedEmitter<ConnectionEvents> {
    private pollId: NodeJS.Timeout;
    private participantId: string;

    private donationIdCache: Record<ExtraLifeDonation["donationID"], true> = {};

    private clearPoll() {
        if (this.pollId != null) {
            clearInterval(this.pollId);
        }
    }

    cacheDonation(donation: ExtraLifeDonation) {
        this.donationIdCache[donation.donationID] = true;
    }

    isDonationCached(donationId: string) {
        return this.donationIdCache[donationId];
    }

    private async getDonations(): Promise<ExtraLifeDonation[] | null> {
        try {
            return await (
                await fetch(
                    `https://www.extra-life.org/api/participants/${this.participantId}/donations`
                )
            ).json() as ExtraLifeDonation[];
        } catch (error) {
            logger.error("Failed to get ExtraLife donations", error);
            return null;
        }
    }

    private async poll() {
        const donations = await this.getDonations();
        if (donations == null) {
            this.stop();
            return;
        }

        donations.forEach((d) => {
            if (this.isDonationCached(d.donationID)) {
                return;
            }
            this.cacheDonation(d);

            eventManager.triggerEvent("extralife", "donation", {
                formattedDonationAmount: `$${d.amount}`,
                donationAmount: d.amount,
                donationMessage: d.message,
                from: d.displayName
            });
        });
    }

    stop() {
        this.clearPoll();
        this.emit("disconnected");
        logger.debug("Stopped ExtraLife poll.");
    }

    async start(participantId: string) {
        this.clearPoll();
        if (participantId == null) {
            return;
        }

        this.participantId = participantId;

        const donations = await this.getDonations();

        if (donations == null) {
            this.stop();
            return;
        }

        donations.forEach((d) => {
            this.cacheDonation(d);
        });

        this.pollId = setInterval(() => this.poll(), 15000);

        this.emit("connected");

        logger.debug("Started ExtraLife poll.");
    }
}

export const extraLifePollService = new ExtraLifePollService();
