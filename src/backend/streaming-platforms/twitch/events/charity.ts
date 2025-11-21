import { EventManager } from "../../../events/event-manager";

export function triggerCharityCampaignStart(
    charityName: string,
    charityDescription: string,
    charityLogo: string,
    charityWebsite: string,
    currentTotalAmount: number,
    currentTotalCurrency: string,
    targetTotalAmount: number,
    targetTotalCurrency: string
) {
    void EventManager.triggerEvent("twitch", "charity-campaign-start", {
        charityName,
        charityDescription,
        charityLogo,
        charityWebsite,
        currentTotalAmount,
        currentTotalCurrency,
        targetTotalAmount,
        targetTotalCurrency
    });
}

export function triggerCharityDonation(
    username: string,
    userId: string,
    userDisplayName: string,
    charityName: string,
    charityDescription: string,
    charityLogo: string,
    charityWebsite: string,
    donationAmount: number,
    donationCurrency: string
) {
    void EventManager.triggerEvent("twitch", "charity-donation", {
        username,
        userId,
        userDisplayName,
        from: userDisplayName,
        charityName,
        charityDescription,
        charityLogo,
        charityWebsite,
        donationAmount,
        donationCurrency
    });
}

export function triggerCharityCampaignProgress(
    charityName: string,
    charityDescription: string,
    charityLogo: string,
    charityWebsite: string,
    currentTotalAmount: number,
    currentTotalCurrency: string,
    targetTotalAmount: number,
    targetTotalCurrency: string
) {
    void EventManager.triggerEvent("twitch", "charity-campaign-progress", {
        charityName,
        charityDescription,
        charityLogo,
        charityWebsite,
        currentTotalAmount,
        currentTotalCurrency,
        targetTotalAmount,
        targetTotalCurrency
    });
}

export function triggerCharityCampaignEnd(
    charityName: string,
    charityDescription: string,
    charityLogo: string,
    charityWebsite: string,
    currentTotalAmount: number,
    currentTotalCurrency: string,
    targetTotalAmount: number,
    targetTotalCurrency: string
) {
    void EventManager.triggerEvent("twitch", "charity-campaign-end", {
        charityName,
        charityDescription,
        charityLogo,
        charityWebsite,
        currentTotalAmount,
        currentTotalCurrency,
        targetTotalAmount,
        targetTotalCurrency,
        goalReached: currentTotalAmount >= targetTotalAmount
    });
}