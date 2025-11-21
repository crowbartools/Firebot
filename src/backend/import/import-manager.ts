import type {
    ThirdPartyImporter,
    LoadRequest,
    LoadResult,
    ParsedQuotes,
    ParsedViewers,
    ImportRequest,
    ImportResult
} from "../../types/import";
import type { Quote } from "../../types/quotes";

import { QuoteManager } from "../quotes/quote-manager";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

import { StreamlabsChatbotImporter } from "./third-party/streamlabs-chatbot-importer";
import { MixItUpImporter } from "./third-party/mix-it-up-importer";
import { FirebotImporter } from "./third-party/firebot-importer";

class ImportManager {
    private _registeredImporters: Record<string, ThirdPartyImporter> = {};
    private _abortController: AbortController;

    constructor() {
        frontendCommunicator.onAsync("import:load-quotes",
            async (request: LoadRequest) => await this.loadQuotes(request)
        );

        frontendCommunicator.onAsync("import:load-viewers",
            async (request: LoadRequest) => await this.loadViewers(request)
        );

        frontendCommunicator.onAsync("import:import-quotes",
            async (request: ImportRequest<Quote[]>) => await this.importQuotes(request)
        );

        frontendCommunicator.onAsync("import:import-viewers",
            async (request: ImportRequest) => await this.importViewers(request)
        );

        frontendCommunicator.onAsync("import:abort-import", async () => {
            this._abortController.abort("Aborted by user");
        });
    }

    registerDefaultImporters(): void {
        this.registerImporter(StreamlabsChatbotImporter);
        this.registerImporter(MixItUpImporter);
        this.registerImporter(FirebotImporter);
    }

    registerImporter(importer: ThirdPartyImporter): void {
        if (this._registeredImporters[importer.id]) {
            return;
        }

        this._registeredImporters[importer.id] = importer;

        logger.debug(`Registered importer ${importer.id} (${importer.appName})`);
    }

    unregisterImporter(importer: ThirdPartyImporter): void {
        if (this._registeredImporters[importer.id] == null) {
            return;
        }

        delete this._registeredImporters[importer.id];

        logger.debug(`Unregistered importer ${importer.id} (${importer.appName})`);
    }

    private async loadQuotes(request: LoadRequest): Promise<LoadResult<ParsedQuotes>> {
        const importer = this._registeredImporters[request.appId];
        let error: string;

        if (importer) {
            if (importer.loadQuotes != null) {
                try {
                    return await importer.loadQuotes(request.filepath);
                } catch (error) {
                    logger.error(`Unexpected error while parsing ${importer.appName} quotes`, error);
                    return {
                        success: false,
                        error: (error as Error).message
                    };
                }
            }

            error = `Unable to import quotes from ${importer.appName}`;
            logger.warn(`Importer ${importer.appName} cannot import quotes`);
        } else {
            error = "Unable to import from that app";
            logger.warn(`No importer registered with ID ${request.appId}`);
        }

        return {
            success: false,
            error
        };
    }

    private async importQuotes(request: ImportRequest<Quote[]>): Promise<ImportResult> {
        const importer = this._registeredImporters[request.appId];
        let error: string;

        if (importer) {
            let quoteImporter = importer.importQuotes;

            // If it can load quotes but doesn't have its own custom importer, use the default
            if (quoteImporter == null && importer.loadQuotes != null) {
                quoteImporter = async (quotes: Quote[]) => {
                    await QuoteManager.addQuotes(quotes);

                    return {
                        success: true
                    };
                };
            }

            if (quoteImporter != null) {
                try {
                    return await quoteImporter(request.data, request.settings);
                } catch (error) {
                    logger.error(`Unexpected error while importing ${importer.appName} quotes`, error);
                    return {
                        success: false,
                        error: (error as Error).message
                    };
                }
            }

            error = `Unable to import quotes from ${importer.appName}`;
            logger.warn(`Importer ${importer.appName} cannot import quotes`);
        } else {
            error = "Unable to import from that app";
            logger.warn(`No importer registered with ID ${request.appId}`);
        }

        return {
            success: false,
            error
        };
    }

    private async loadViewers(request: LoadRequest): Promise<LoadResult<ParsedViewers>> {
        const importer = this._registeredImporters[request.appId];
        let error: string;

        if (importer) {
            if (importer.loadViewers != null) {
                try {
                    return await importer.loadViewers(request.filepath);
                } catch (error) {
                    logger.error(`Unexpected error while parsing ${importer.appName} viewers`, error);
                    return {
                        success: false,
                        error: (error as Error).message
                    };
                }
            }

            error = `Unable to import viewers from ${importer.appName}`;
            logger.warn(`Importer for ${importer.appName} cannot import viewers`);
        } else {
            error = "Unable to import from that app";
            logger.warn(`No importer registered with ID ${request.appId}`);
        }

        return {
            success: false,
            error
        };
    }

    private async importViewers(request: ImportRequest): Promise<LoadResult<ParsedViewers>> {
        const importer = this._registeredImporters[request.appId];
        let error: string;
        this._abortController = new AbortController();

        if (importer) {
            if (importer.importViewers != null) {
                try {
                    return await importer.importViewers(request.data as unknown[], request.settings, this._abortController.signal);
                } catch (error) {
                    logger.error(`Unexpected error while importing ${importer.appName} viewers`, error);
                    return {
                        success: false,
                        error: (error as Error).message
                    };
                }
            }

            error = `Unable to import viewers from ${importer.appName}`;
            logger.warn(`Importer for ${importer.appName} cannot import viewers`);
        } else {
            error = "Unable to import from that app";
            logger.warn(`No importer registered with ID ${request.appId}`);
        }

        return {
            success: false,
            error
        };
    }
}

const manager = new ImportManager();

export { manager as ImportManager };