import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {
    readonly authToken: string;
    constructor() {
        this.authToken = "secret";
    }
}