import frontendCommunicator from "../common/frontend-communicator";
import currencyAccess from "../currency/currency-access";
import rankManager from "../ranks/rank-manager";
import viewerDatabase from "./viewer-database";
import logger from "../logwrapper";

import { DateTime } from "luxon";
import fsp from "fs/promises";

import type { FirebotViewer } from "../../types/viewers";

interface ViewerExportOptions {
    viewers: boolean;
    currencies: boolean;
    ranks: boolean;
}

class ViewerExportManager {
    constructor() {}

    setupListeners () {
        frontendCommunicator.onAsync("export-viewers", async (data: { folderpath: string, exportOptions: ViewerExportOptions }) => {
            return await this.exportViewersToFile(data.folderpath, data.exportOptions)
        });
    }

    async exportViewersToFile(folderpath: string, exportOptions: ViewerExportOptions): Promise<boolean> {
        try {
            const viewers = await viewerDatabase.getAllViewers();
            if (exportOptions.viewers) {
                await this.createViewersFile(viewers, folderpath);
            }

            if (exportOptions.currencies) {
                await this.createCurrenciesFile(viewers, folderpath);
            }

            if (exportOptions.ranks) {
                await this.createRanksFile(viewers, folderpath);
            }

            return true;
        } catch (error) {
            logger.error("Error exporting viewer data to file", error);
            return false;
        }
    }

    async createViewersFile(viewers: FirebotViewer[], folderpath: string): Promise<boolean> {
        try {
            const fileLines: string[] = [];

            const headers = [
                "ID",
                "Username",
                "Last Seen",
                "Join Date",
                "Minutes in Channel",
                "Chat Messages"
            ];

            fileLines.push(headers.join(","));

            for (const viewer of viewers) {
                const viewerData = [
                    viewer._id,
                    viewer.displayName || viewer.username,
                    DateTime.fromMillis(viewer.joinDate).toUTC().toFormat("yyyy-MM-dd"),
                    DateTime.fromMillis(viewer.lastSeen).toUTC().toFormat("yyyy-MM-dd"),
                    viewer.minutesInChannel,
                    viewer.chatMessages
                ];

                fileLines.push(viewerData.join(","));
            }

            await fsp.writeFile(folderpath + "/viewers.csv", fileLines.join("\n"), { encoding: "utf8" });
            return true;
        } catch (error) {
            logger.error("Error exporting viewers to file", error);
            return false;
        }
    }

    async createCurrenciesFile(viewers: FirebotViewer[], folderpath: string): Promise<boolean> {
        const currencies = currencyAccess.getCurrencies();

        if (!currencies || !Object.keys(currencies).length) {
            return true;
        }

        try {
            const fileLines: string[] = [];

            const headers = [
                "ID",
                "Username"
            ];
            for (const currency of Object.values(currencies)) {
                headers.push(currency.name);
            }

            fileLines.push(headers.join(","));

            for (const viewer of viewers) {
                const viewerData = [
                    viewer._id,
                    viewer.displayName || viewer.username
                ];

                for (const currency of Object.values(viewer.currency)) {
                    viewerData.push(currency.toString());
                }

                fileLines.push(viewerData.join(","));
            }

            await fsp.writeFile(folderpath + "/currencies.csv", fileLines.join("\n"), { encoding: "utf8" });
            return true;
        } catch (error) {
            logger.error("Error exporting currencies to file", error);
            return false;
        }
    }

    async createRanksFile(viewers: FirebotViewer[], folderpath: string): Promise<boolean> {
        const ranks = rankManager.getAllItems();
        if (!ranks || !ranks.length) {
            return true;
        }

        try {
            const fileLines: string[] = [];

            const headers = [
                "ID",
                "Username"
            ];

            for (const rank of ranks) {
                headers.push(rank.name);
            }

            fileLines.push(headers.join(","));

            for (const viewer of viewers) {
                const viewerData = [
                    viewer._id,
                    viewer.displayName || viewer.username
                ];

                if (viewer.ranks && Object.keys(viewer.ranks).length) {
                    for (const [viewerRankladder, viewerRank] of Object.entries(viewer.ranks)) {
                        const rankladder = ranks.find(rl => rl.id === viewerRankladder);

                        if (!rankladder) {
                            continue;
                        }

                        viewerData.push(rankladder.ranks.find(r => r.id === viewerRank).name || "");
                    }
                }

                fileLines.push(viewerData.join(","));
            }

            await fsp.writeFile(folderpath + "/ranks.csv", fileLines.join("\n"), { encoding: "utf8" });
            return true;
        } catch (error) {
            logger.error("Error exporting ranks to file", error);
            return false;
        }
    }
}

const manager = new ViewerExportManager();

export { manager as ViewerExportManager };