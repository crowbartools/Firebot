import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { ProfileService } from "../profile.service";
import { BaseProfileStore } from "./base-profile-store";
import { EventConfigsSettings } from "firebot-types";

@Injectable()
export class EventsConfigsStore extends BaseProfileStore<EventConfigsSettings> {
    constructor(profileService: ProfileService, moduleRef: ModuleRef) {
        super(
            "events",
            {
                mainEvents: [],
                groups: [],
                sortTags: [],
            },
            profileService,
            moduleRef
        );
    }
}
