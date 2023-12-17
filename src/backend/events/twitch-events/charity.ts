import eventManager from "../../events/EventManager";

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
    eventManager.triggerEvent("twitch", "charity-campaign-start", {
        charityName,
        charityDescription,
        charityLogo,
        charityWebsite,
        currentTotalAmount,
        currentTotalCurrency,
        targetTotalAmount,
        targetTotalCurrency
    });
};

export function triggerCharityDonation(
    username: string,
    charityName: string,
    charityDescription: string,
    charityLogo: string,
    charityWebsite: string,
    donationAmount: number,
    donationCurrency: string 
) {
    eventManager.triggerEvent("twitch", "charity-donation", {
        from: username,
        charityName,
        charityDescription,
        charityLogo,
        charityWebsite,
        donationAmount,
        donationCurrency
    });
};

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
    eventManager.triggerEvent("twitch", "charity-campaign-progress", {
        charityName,
        charityDescription,
        charityLogo,
        charityWebsite,
        currentTotalAmount,
        currentTotalCurrency,
        targetTotalAmount,
        targetTotalCurrency
    });
};

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
    eventManager.triggerEvent("twitch", "charity-campaign-end", {
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
};