import {
    Body,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from "@nestjs/common";
import { FirebotController } from "misc/firebot-controller.decorator";
import { EventConfig, EventGroup } from "firebot-types";
import { EventsService } from "./events.service";

@FirebotController({
    path: "events",
})
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Get("all")
    getAllEventData() {
        return this.eventsService.getAllEventData();
    }

    @Get("active")
    getAllActiveEvents() {
        return this.eventsService.getAllActiveEvents();
    }

    @Post("main")
    createMainEvent(@Body() event: Omit<EventConfig, "id">) {
        return this.eventsService.createMainEvent(event);
    }

    @Patch("main/:eventId")
    updateMainEvent(
        @Param("eventId") eventId: string,
        @Body() eventUpdate: Partial<Omit<EventConfig, "id">>
    ) {
        return this.eventsService.updateMainEvent(eventId, eventUpdate);
    }

    @Delete("main/:eventId")
    deleteMainEvent(@Param("eventId") eventId: string) {
        return this.eventsService.deleteMainEvent(eventId);
    }

    @Post("groups")
    createGroup(@Body() body: Pick<EventGroup, "name">) {
        return this.eventsService.createGroup(body.name);
    }

    @Patch("groups/:groupId")
    updateGroup(
        @Param("groupId") groupId: string,
        @Body() groupUpdate: Partial<Pick<EventGroup, "name" | "active">>
    ) {
        return this.eventsService.updateGroup(groupId, groupUpdate);
    }

    @Delete("groups/:groupId")
    deleteGroup(@Param("groupId") groupId: string) {
        return this.eventsService.deleteGroup(groupId);
    }

    @Post("groups/:groupId/events")
    createGroupEvent(
        @Param("groupId") groupId: string,
        @Body() event: Omit<EventConfig, "id">
    ) {
        return this.eventsService.createGroupEvent(groupId, event);
    }

    @Patch("groups/:groupId/events/:eventId")
    updateGroupEvent(
        @Param("groupId") groupId: string,
        @Param("eventId") eventId: string,
        @Body() eventUpdate: Partial<Omit<EventConfig, "id">>
    ) {
        return this.eventsService.updateGroupEvent(groupId, eventId, eventUpdate);
    }

    @Delete("groups/:groupId/events/:eventId")
    deleteGroupEvent(
        @Param("groupId") groupId: string,
        @Param("eventId") eventId: string
    ) {
        return this.eventsService.deleteGroupEvent(groupId, eventId);
    }
}
