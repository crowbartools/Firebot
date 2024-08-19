import { RankLadder, Rank } from "../../types/ranks";
import { FirebotViewer } from "../../types/viewers";
import currencyAccess from "../currency/currency-access";

export class RankLadderHelper {

    constructor(private readonly rankLadder: RankLadder) {
    }

    get id() {
        return this.rankLadder.id;
    }

    get name() {
        return this.rankLadder.name;
    }

    get mode() {
        return this.rankLadder.mode;
    }

    get trackBy() {
        return this.rankLadder.settings?.trackBy;
    }

    get currencyId() {
        return this.rankLadder.settings?.currencyId;
    }

    get metadataKey() {
        return this.rankLadder.settings?.metadataKey;
    }

    get announcePromotionsInChat() {
        return this.rankLadder.settings?.announcePromotionsInChat ?? false;
    }

    get promotionMessageTemplate() {
        const customTemplate = this.rankLadder.settings?.customPromotionMessageTemplate;
        if (customTemplate?.length) {
            return customTemplate;
        }
        return `@{user} has achieved the rank of {rank}${this.rankLadder.mode === "auto" ? ' ({rankDescription})' : ''}!`;
    }

    getRank(rankId: string): Rank | undefined {
        return this.rankLadder.ranks.find(rank => rank.id === rankId);
    }

    getRankByName(name: string): Rank | null {
        const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, "");
        return this.rankLadder.ranks.find(rank => normalize(rank.name) === normalize(name)) ?? null;
    }

    isRankHigher(rankId: string, comparedToRankId: string): boolean {
        const firstRankIndex = this.rankLadder.ranks.findIndex(rank => rank.id === rankId);
        const secondRankIndex = this.rankLadder.ranks.findIndex(rank => rank.id === comparedToRankId);
        if (secondRankIndex === -1) {
            return true;
        }
        if (firstRankIndex === -1) {
            return false;
        }
        return firstRankIndex < secondRankIndex;
    }

    getHighestQualifiedRankId(viewer: FirebotViewer): string | null {
        if (this.mode !== "auto") {
            return null;
        }
        const ranks = this.rankLadder.ranks;
        const viewersValue = this.getTrackByValue(viewer);
        const rank = ranks.find(rank => viewersValue >= rank.value ?? 0);

        return rank?.id;
    }

    getNextRankId(currentRankId?: string): string | null {
        const ranks = this.rankLadder.ranks;
        const currentRankIndex = ranks.findIndex(rank => rank.id === currentRankId);
        if (currentRankIndex === -1) {
            return ranks[ranks.length - 1]?.id ?? null;
        }
        const newRankIndex = currentRankIndex - 1;
        if (newRankIndex < 0) {
            return null;
        }
        return ranks[newRankIndex]?.id ?? null;
    }

    getPreviousRankId(currentRankId: string): string | null {
        const ranks = this.rankLadder.ranks;
        const currentRankIndex = ranks.findIndex(rank => rank.id === currentRankId);
        if (currentRankIndex === -1) {
            return null;
        }
        return ranks[currentRankIndex + 1]?.id ?? null;
    }

    hasRank(rankId: string): boolean {
        return this.rankLadder.ranks.some(rank => rank.id === rankId);
    }

    getRankValueDescription(rankId: string): string | null {
        const rank = this.getRank(rankId);
        if (!rank) {
            return null;
        }

        if (this.trackBy === "view_time") {
            return `${rank.value ?? -1} hours of view time`;
        }

        if (this.trackBy === "currency") {
            const currency = currencyAccess.getCurrencyById(this.currencyId);
            return `${rank.value ?? -1} ${currency?.name ?? 'currency'}`;
        }

        return `${rank.value ?? -1}`;
    }

    private getTrackByValue(viewer: FirebotViewer): number {
        switch (this.trackBy) {
            case "view_time":
                return viewer.minutesInChannel / 60;
            case "currency":
                return viewer.currency?.[this.currencyId ?? ''] ?? 0;
            case "metadata": {
                const metadataValue = Number(viewer.metadata?.[this.metadataKey ?? '']);
                if (!isNaN(metadataValue)) {
                    return metadataValue;
                }
                return 0;
            }
            default:
                return 0;
        }
    }
}