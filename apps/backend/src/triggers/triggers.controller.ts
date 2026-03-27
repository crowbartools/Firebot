import { Body, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { TriggerConfig, TriggerGroup } from "firebot-types";
import { FirebotController } from "misc/firebot-controller.decorator";
import { TriggersService } from "./triggers.service";

@FirebotController({
    path: "triggers",
})
export class TriggersController {
    constructor(private readonly triggersService: TriggersService) { }

    @Get("all")
    getAllTriggerData() {
        return this.triggersService.getAllTriggerData();
    }

    @Get("active")
    getAllActiveTriggers() {
        return this.triggersService.getAllActiveTriggers();
    }

    @Post("main")
    createMainTrigger(@Body() trigger: Omit<TriggerConfig, "id">) {
        return this.triggersService.createMainTrigger(trigger);
    }

    @Patch("main/:triggerId")
    updateMainTrigger(
        @Param("triggerId") triggerId: string,
        @Body() triggerUpdate: Partial<Omit<TriggerConfig, "id">>
    ) {
        return this.triggersService.updateMainTrigger(triggerId, triggerUpdate);
    }

    @Delete("main/:triggerId")
    deleteMainTrigger(@Param("triggerId") triggerId: string) {
        return this.triggersService.deleteMainTrigger(triggerId);
    }

    @Post("groups")
    createGroup(@Body() body: Pick<TriggerGroup, "name">) {
        return this.triggersService.createGroup(body.name);
    }

    @Patch("groups/:groupId")
    updateGroup(
        @Param("groupId") groupId: string,
        @Body() groupUpdate: Partial<Pick<TriggerGroup, "name" | "active">>
    ) {
        return this.triggersService.updateGroup(groupId, groupUpdate);
    }

    @Delete("groups/:groupId")
    deleteGroup(@Param("groupId") groupId: string) {
        return this.triggersService.deleteGroup(groupId);
    }

    @Post("groups/:groupId/triggers")
    createGroupTrigger(
        @Param("groupId") groupId: string,
        @Body() trigger: Omit<TriggerConfig, "id">
    ) {
        return this.triggersService.createGroupTrigger(groupId, trigger);
    }

    @Patch("groups/:groupId/triggers/:triggerId")
    updateGroupTrigger(
        @Param("groupId") groupId: string,
        @Param("triggerId") triggerId: string,
        @Body() triggerUpdate: Partial<Omit<TriggerConfig, "id">>
    ) {
        return this.triggersService.updateGroupTrigger(
            groupId,
            triggerId,
            triggerUpdate
        );
    }

    @Delete("groups/:groupId/triggers/:triggerId")
    deleteGroupTrigger(
        @Param("groupId") groupId: string,
        @Param("triggerId") triggerId: string
    ) {
        return this.triggersService.deleteGroupTrigger(groupId, triggerId);
    }
}