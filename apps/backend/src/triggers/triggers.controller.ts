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

    @Get("sources")
    getTriggerSourceDefinitions() {
        return this.triggersService.getTriggerSourceDefinitions();
    }

    @Get("tags")
    getAllTags() {
        return this.triggersService.getAllTags();
    }

    @Post("tags")
    createTag(@Body() body: { tag: string }) {
        return this.triggersService.createTag(body.tag);
    }

    @Delete("tags/:tag")
    deleteTag(@Param("tag") tag: string) {
        return this.triggersService.deleteTag(decodeURIComponent(tag));
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

    @Post("main/:triggerId/reorder")
    reorderMainTrigger(
        @Param("triggerId") triggerId: string,
        @Body() body: { targetIndex: number }
    ) {
        return this.triggersService.reorderMainTrigger(triggerId, body.targetIndex);
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

    @Post("groups/:groupId/triggers/:triggerId/reorder")
    reorderGroupTrigger(
        @Param("groupId") groupId: string,
        @Param("triggerId") triggerId: string,
        @Body() body: { targetIndex: number }
    ) {
        return this.triggersService.reorderGroupTrigger(
            groupId,
            triggerId,
            body.targetIndex
        );
    }
}