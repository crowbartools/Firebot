import { Injectable } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { StreamingPlatformLoginsStore } from "./stores/streaming-platform-logins.store";

@Injectable()
export class LoginService {
  constructor(
    private readonly loginsStore: StreamingPlatformLoginsStore
  ) {}

    getAllPlatformLogins() {
        return this.loginsStore.getRoot();
    }

    createLoginForPlatform(platformId: string) {
        const allLogins = this.loginsStore.getRoot();
        let platformLogins = allLogins[platformId];
        if (!platformLogins) {
          platformLogins = {
            activeLoginConfigId: "",
            loginConfigs: [],
          };
        }
        const loginConfigId = uuid();
        platformLogins.activeLoginConfigId = loginConfigId;
        const loginConfig = {
          id: loginConfigId,
          streamer: undefined,
          bot: undefined,
        };
        platformLogins.loginConfigs.push(loginConfig);
        this.loginsStore.set(platformId, platformLogins);
        return loginConfig;
    }

    setActiveLoginConfig(platformId: string, loginConfigId: string): boolean {
        const platformLogins = this.loginsStore.get(platformId)
        if(!platformLogins || !platformLogins.loginConfigs.some((lc) => lc.id === loginConfigId)) {
            return false;
        }
        platformLogins.activeLoginConfigId = loginConfigId;
        this.loginsStore.set(platformId, platformLogins);
        return true;
    }

    deleteLoginForPlatform(platformId: string, loginConfigId: string): boolean {
        const platformLogins = this.loginsStore.get(platformId)
        if(!platformLogins || !platformLogins.loginConfigs.some((lc) => lc.id === loginConfigId)) {
            return false;
        }
        platformLogins.loginConfigs = platformLogins.loginConfigs.filter((lc) => lc.id !== loginConfigId);
        if(platformLogins.activeLoginConfigId === loginConfigId) {
            platformLogins.activeLoginConfigId = platformLogins.loginConfigs[0]?.id;
        }
        this.loginsStore.set(platformId, platformLogins);
        return true;
    }
}