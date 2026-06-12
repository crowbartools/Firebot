import { CronJob } from "cron";
import { DateTime } from "luxon";

import type { ScheduledTask, Trigger } from "../../types";

import JsonDbManager from "../database/json-db-manager";
import { AccountAccess } from "../common/account-access";
import connectionManager from "../common/connection-manager";
import effectRunner from "../common/effect-runner";
import frontendCommunicator from "../common/frontend-communicator";

interface ScheduledTaskRunner {
    taskDefinition: ScheduledTask;
    cronjob: CronJob;
}

class ScheduledTaskManager extends JsonDbManager<ScheduledTask> {
    taskCache: Map<string, ScheduledTaskRunner> = new Map();

    constructor() {
        super("Scheduled Task", "scheduled-tasks", "Scheduled Tasks");

        frontendCommunicator.on("scheduled-tasks:get-scheduled-tasks",
            () => this.getAllItems()
        );

        frontendCommunicator.on("scheduled-tasks:save-scheduled-task",
            (task: ScheduledTask) => this.saveScheduledTask(task)
        );

        frontendCommunicator.on("scheduled-tasks:save-all-scheduled-tasks",
            (tasks: ScheduledTask[]) => this.saveAllItems(tasks)
        );

        frontendCommunicator.on("scheduled-tasks:delete-scheduled-task",
            (id: string) => this.deleteScheduledTask(id)
        );
    }

    start(): void {
        this.logger.info("Starting scheduled task manager...");
        this.getAllItems().map(t => this.taskCache.set(t.id, <ScheduledTaskRunner>{ taskDefinition: t, cronjob: this.createCronJob(t) }));

        this.logger.info(`Found ${this.taskCache.size} scheduled task(s)`);
        this.taskCache.forEach((val) => {
            if (val.taskDefinition.enabled) {
                this.startTask(val);
            }
        });

        this.logger.info("Scheduled task manager started");
    }

    stop(): void {
        this.logger.info("Stopping scheduled task manager...");
        this.taskCache.forEach((val) => {
            this.stopTask(val, true);
        });
        this.logger.info("Scheduled task manager stopped");
    }

    private createCronJob(task: ScheduledTask): CronJob {
        return new CronJob(
            task.schedule,
            () => {
                if (task.onlyWhenLive && !connectionManager.streamerIsOnline()) {
                    this.logger.debug(`Skipping scheduled task "${task.name}" run - stream is offline`);
                    return;
                }

                this.logger.info(`Running scheduled task "${task.name}"`);

                const effectsRequest = {
                    trigger: {
                        type: "scheduled_task",
                        metadata: {
                            username: AccountAccess.getAccounts().streamer.username,
                            userId: AccountAccess.getAccounts().streamer.userId,
                            userDisplayName: AccountAccess.getAccounts().streamer.displayName,
                            task: task
                        }
                    } as Trigger,
                    effects: task.effects
                };
                void effectRunner.processEffects(effectsRequest);

                this.logNextTaskRun(task);
            }
        );
    }

    private startTask(taskRunner: ScheduledTaskRunner): void {
        this.logger.debug(`Starting scheduled task timer for "${taskRunner.taskDefinition.name}"...`);

        if (taskRunner.cronjob == null) {
            taskRunner.cronjob = this.createCronJob(taskRunner.taskDefinition);
        }

        if (taskRunner.cronjob.isActive) {
            this.logger.debug(`Scheduled task timer for "${taskRunner.taskDefinition.name}" is already running`);
        } else {
            taskRunner.cronjob.start();
            this.logger.debug(`Scheduled task timer for "${taskRunner.taskDefinition.name}" started. Next run: ${taskRunner.cronjob.nextDate().toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS)}`);
        }
    }

    private stopTask(taskRunner: ScheduledTaskRunner, removeCrontab = false): void {
        this.logger.debug(`Stopping scheduled task timer for ${taskRunner.taskDefinition.name}...`);

        if (taskRunner.cronjob == null) {
            taskRunner.cronjob = this.createCronJob(taskRunner.taskDefinition);
        }

        if (taskRunner.cronjob.isActive) {
            void taskRunner.cronjob.stop();
            this.logger.debug(`Scheduled task timer for "${taskRunner.taskDefinition.name}" stopped`);
        } else {
            this.logger.debug(`Scheduled task timer for "${taskRunner.taskDefinition.name}" is not running`);
        }

        if (removeCrontab) {
            taskRunner.cronjob = null;
        }
    }

    private logNextTaskRun(task: ScheduledTask): void {
        if (this.taskCache.has(task.id)) {
            const taskRunner = this.taskCache.get(task.id);

            if (taskRunner.cronjob.isActive) {
                this.logger.debug(`Scheduled task "${task.name}" next run: ${taskRunner.cronjob.nextDate().toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS)}`);
            } else {
                this.logger.debug(`Scheduled task "${task.name}" not running.`);
            }
        } else {
            this.logger.debug(`Scheduled task "${task.name}" not in cache.`);
        }
    }

    saveScheduledTask(task: ScheduledTask): ScheduledTask {
        this.logger.debug(`Saving scheduled task "${task.name}"...`);
        const savedTask = super.saveItem(task);

        if (savedTask) {
            if (this.taskCache.has(savedTask.id) &&
                this.taskCache.get(savedTask.id).cronjob?.isActive) {
                this.stopTask(this.taskCache.get(savedTask.id));
            }

            this.taskCache.set(savedTask.id, {
                taskDefinition: savedTask,
                cronjob: this.createCronJob(savedTask)
            });

            if (savedTask.enabled) {
                this.startTask(this.taskCache.get(savedTask.id));
            }

            frontendCommunicator.send("scheduledTaskUpdate", savedTask);

            return savedTask;
        }

        return null;
    }

    deleteScheduledTask(id: string): void {
        this.logger.debug(`Deleting scheduled task ${id}...`);

        const task = super.getItem(id);
        if (task != null) {
            if (this.taskCache.has(id)) {
                const taskRunner = this.taskCache.get(id);

                if (taskRunner != null) {
                    this.stopTask(taskRunner, true);
                    this.taskCache.delete(id);
                    super.deleteItem(id);
                    this.logger.debug(`Scheduled task with ID ${id} deleted`);
                }
            } else {
                this.logger.debug(`No scheduled task found in task cache with ID ${id}`);
            }
        } else {
            this.logger.debug(`No scheduled task found with ID ${id}`);
        }
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("allScheduledTasksUpdated", this.getAllItems());
    }
}

const manager = new ScheduledTaskManager();

export { manager as ScheduledTaskManager };