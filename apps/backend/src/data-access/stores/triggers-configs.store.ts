import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { TriggerConfigsSettings } from "firebot-types";
import { ProfileService } from "../profile.service";
import { BaseProfileStore } from "./base-profile-store";

@Injectable()
export class TriggersConfigsStore extends BaseProfileStore<TriggerConfigsSettings> {
    constructor(profileService: ProfileService, moduleRef: ModuleRef) {
        super(
            "triggers",
            {
                mainTriggers: [],
                groups: [],
                sortTags: [],
            },
            profileService,
            moduleRef
        );
    }
}