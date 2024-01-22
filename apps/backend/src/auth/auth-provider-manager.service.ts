import { Injectable } from "@nestjs/common";
import { TypedEmitter } from "tiny-typed-emitter";
import { AuthProvider } from "firebot-types";

@Injectable()
export class AuthProviderManager extends TypedEmitter {
    private readonly providers: AuthProvider[] = [];

    constructor() {
        super();
    }

    registerProvider(provider: AuthProvider) {
        if (this.providers.some(p => p.id === provider.id)) {
            throw new Error(`Provider with ID ${provider.id} already exists.`);
        }
        this.providers.push(provider);
    }

    getProvider(id: string) {
        return this.providers.find(p => p.id === id);
    }
}