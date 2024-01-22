import { Inject, Injectable } from "@nestjs/common";
import { TypedEmitter } from "tiny-typed-emitter";
import { Profile } from "firebot-types"
import { GlobalSettingsStore } from "data-access/stores/global-settings.store";
import sanitizeFilename from "sanitize-filename";
import { v4 as uuid } from "uuid"
import fs from "fs/promises";
import { AppConfig } from "config/app.config";
import { ConfigType } from "@nestjs/config";
import path from "path";

@Injectable()
export class ProfileService extends TypedEmitter<{
  activeProfileChanged: (profile: Profile) => void;
}> {
  constructor(
    private readonly globalSettingsStore: GlobalSettingsStore, 
    @Inject(AppConfig.KEY)
    private readonly appConfig: ConfigType<typeof AppConfig>
  ) {
    super();
  }

  getActiveProfile() {
    return this.globalSettingsStore.get("profiles").find(
      (p) => p.id === this.globalSettingsStore.get("activeProfileId")
    )!;
  }

  private setActiveProfile(profile: Profile) {
    this.globalSettingsStore.set("activeProfileId", profile.id);
    this.emit("activeProfileChanged", profile);
  }

  getProfiles() {
    return this.globalSettingsStore.get("profiles");
  }

  addProfile(name: string) {
    name = sanitizeFilename(name);
    const newProfile: Profile = {
      id: uuid(),
      name,
    };

    const profiles = this.getProfiles();
    if (!profiles.length) {
      this.setActiveProfile(newProfile);
    }
    profiles.push(newProfile);
    this.globalSettingsStore.set("profiles", profiles);

    return newProfile;
  }

  async renameProfile(id: string, newName: string) {
    const profile = this.getProfiles().find((p) => p.id === id);
    if (!profile) {
      return new Error(`Profile ${id} doesn't exist`);
    }

    newName = sanitizeFilename(newName);
    const oldName = profile.name;

    profile.name = newName;

    this.globalSettingsStore.set("profiles", this.getProfiles());

    const oldProfilePath = path.join(this.appConfig.firebotDataPath, "profiles", oldName);
    const newProfilePath = path.join(
      this.appConfig.firebotDataPath,
      "profiles",
      profile.name
    );

    await fs.rename(oldProfilePath, newProfilePath);

    return newName;
  }

  async removeProfile(id: string) {
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === id);
    if (index > -1 && profiles.length > 1) {
      const profile = profiles[index];
      profiles.splice(index, 1);
      this.globalSettingsStore.set("profiles", profiles);
      const profilePath = path.join(
        this.appConfig.firebotDataPath,
        "profiles",
        profile.name
      );
      await fs.rm(profilePath, {
        recursive: true,
        force: true,
      });
    }
  }

  switchToProfile(id: string) {
    const currentActiveProfileId = this.globalSettingsStore.get("activeProfileId");
    const profile = this.getProfiles().find((p) => p.id === id);
    if (currentActiveProfileId != id && !!profile) {
      this.setActiveProfile(profile);
    }
  }
}