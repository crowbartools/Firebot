export interface AuthProvider {
    id: string;
    name: string;
    type: "code" | "device";
    url: {
        host: string;
        authorizePath: string;
        tokenPath: string;
    },
    /**
     * @default "localhost"
     */
    redirectUriHost?: string;
    scopes: string[];
}
