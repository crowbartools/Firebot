import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useCreateTriggerGroup } from "@/hooks/api/triggers/use-create-trigger-group";
import { useCreateTrigger } from "@/hooks/api/triggers/use-create-trigger";
import { useDeleteTriggerGroup } from "@/hooks/api/triggers/use-delete-trigger-group";
import { useDeleteTrigger } from "@/hooks/api/triggers/use-delete-trigger";
import { useReorderTrigger } from "@/hooks/api/triggers/use-reorder-trigger";
import {
  useCreateTriggerTag,
  useDeleteTriggerTag,
  useTriggerTags,
} from "@/hooks/api/triggers/use-trigger-tags";
import { useTriggerSources } from "@/hooks/api/triggers/use-trigger-sources";
import { useUpdateTriggerGroup } from "@/hooks/api/triggers/use-update-trigger-group";
import { useUpdateTrigger } from "@/hooks/api/triggers/use-update-trigger";
import { useTriggers } from "@/hooks/api/use-triggers";
import {
  FirebotActionWorkflow,
  TriggerConfig,
  TriggerGroup,
} from "firebot-types";
import {
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  FolderPlus,
  GripVertical,
  Plus,
  Rows3,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

function createDefaultWorkflow() {
  return {
    id: uuid(),
    nodes: [
      {
        id: uuid(),
        type: "trigger" as const,
        position: { x: 0, y: 0 },
        schema: {
          outcomes: [{ slug: "triggered" as const }],
        },
      },
    ],
    edges: [],
  } as FirebotActionWorkflow;
}

function createBlankTrigger(
  name: string,
  sourceId: string,
  eventId: string,
  active = true
): Omit<TriggerConfig, "id"> {
  return {
    name,
    sourceId,
    eventId,
    tags: [],
    active,
    actionWorkflow: createDefaultWorkflow(),
  };
}

function cloneTrigger(trigger: TriggerConfig): Omit<TriggerConfig, "id"> {
  return {
    ...trigger,
    name: `${trigger.name ?? "Unnamed Trigger"} copy`,
    actionWorkflow: {
      ...trigger.actionWorkflow,
      id: uuid(),
    },
  };
}

function normalizeTag(tag: string): string {
  return tag.trim();
}

type TriggerTypeOption = {
  sourceId: string;
  sourceName: string;
  eventId: string;
  eventName: string;
  description?: string;
};

type ConfirmAction =
  | { type: "delete-trigger"; groupId?: string; triggerId: string; message: string }
  | { type: "delete-set"; groupId: string; message: string }
  | { type: "delete-tag"; tag: string; message: string }
  | null;

type TriggerSetDraft = {
  name: string;
};

function TriggerRow({
  trigger,
  triggerIndex,
  totalTriggers,
  triggerTypeLabel,
  inGroupId,
  groups,
  copiedTrigger,
  availableTags,
  isDragTarget,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  onKeyboardReorder,
  onToggle,
  onEdit,
  onDuplicate,
  onCopy,
  onPaste,
  onDelete,
  onMove,
  onReorder,
  onAddTag,
  onRequestAddTag,
  onRemoveTag,
  onDeleteTagFromSystem,
}: {
  trigger: TriggerConfig;
  triggerIndex: number;
  totalTriggers: number;
  triggerTypeLabel: string;
  inGroupId?: string;
  groups: TriggerGroup[];
  copiedTrigger: Omit<TriggerConfig, "id"> | null;
  availableTags: string[];
  isDragTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onDragOver: () => void;
  onKeyboardReorder: (targetIndex: number) => void;
  onToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onMove: (target: { groupId?: string }) => void;
  onReorder: (targetIndex: number) => void;
  onAddTag: (tag: string) => void;
  onRequestAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onDeleteTagFromSystem: (tag: string) => void;
}) {
  const canMoveUp = triggerIndex > 0;
  const canMoveDown = triggerIndex < totalTriggers - 1;
  const triggerTags = trigger.tags ?? [];

  return (
    <div
      className={`border rounded-md px-3 py-2 mb-2 bg-background ${isDragTarget ? "ring-1 ring-primary" : ""}`}
      onDrop={onDrop}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver();
      }}
    >
      <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              onKeyboardReorder(Math.max(triggerIndex - 1, 0));
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              onKeyboardReorder(Math.min(triggerIndex + 1, totalTriggers - 1));
            }

            if (event.key === "Home") {
              event.preventDefault();
              onKeyboardReorder(0);
            }

            if (event.key === "End") {
              event.preventDefault();
              onKeyboardReorder(totalTriggers - 1);
            }
          }}
          className="size-8 inline-flex items-center justify-center rounded-sm opacity-60 hover:opacity-100"
          aria-label="Reorder trigger. Use drag and drop or arrow keys, Home, and End."
          title="Reorder trigger"
        >
          <GripVertical className="size-4" />
        </button>

        <div>
          <div className="font-medium">{trigger.name || "Unnamed Trigger"}</div>
          <div className="text-sm opacity-80">{triggerTypeLabel}</div>
          <div className="text-xs mt-1">{trigger.active ? "Active" : "Inactive"}</div>
          {triggerTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {triggerTags.map((tag) => (
                <span key={tag} className="text-xs rounded-sm border px-2 py-0.5 opacity-90">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Trigger actions">
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggle}>
              {trigger.active ? "Disable Trigger" : "Enable Trigger"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onCopy}>Copy</DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}>Duplicate</DropdownMenuItem>
            <DropdownMenuItem onSelect={onDelete} variant="destructive">
              Delete
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!copiedTrigger} onSelect={onPaste}>
              Paste
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Tags...</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={onRequestAddTag}>Add new tag...</DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableTags.map((tag) => (
                  <DropdownMenuItem
                    key={`apply-${tag}`}
                    disabled={triggerTags.includes(tag)}
                    onSelect={() => onAddTag(tag)}
                  >
                    Apply: {tag}
                  </DropdownMenuItem>
                ))}
                {triggerTags.length > 0 && <DropdownMenuSeparator />}
                {triggerTags.map((tag) => (
                  <DropdownMenuItem key={`remove-${tag}`} onSelect={() => onRemoveTag(tag)}>
                    Remove: {tag}
                  </DropdownMenuItem>
                ))}
                {triggerTags.length > 0 && <DropdownMenuSeparator />}
                {triggerTags.map((tag) => (
                  <DropdownMenuItem
                    key={`delete-${tag}`}
                    variant="destructive"
                    onSelect={() => onDeleteTagFromSystem(tag)}
                  >
                    Delete tag globally: {tag}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Transfer to...</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {inGroupId && (
                  <DropdownMenuItem onSelect={() => onMove({ groupId: undefined })}>
                    Main Triggers
                  </DropdownMenuItem>
                )}
                {groups
                  .filter((group) => group.id !== inGroupId)
                  .map((group) => (
                    <DropdownMenuItem key={group.id} onSelect={() => onMove({ groupId: group.id })}>
                      {group.name}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to...</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem disabled={!canMoveUp} onSelect={() => onReorder(0)}>
                  Top
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canMoveUp} onSelect={() => onReorder(triggerIndex - 1)}>
                  Up
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canMoveDown} onSelect={() => onReorder(triggerIndex + 1)}>
                  Down
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canMoveDown}
                  onSelect={() => onReorder(totalTriggers - 1)}
                >
                  Bottom
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function TriggersPage() {
  const { data, isLoading } = useTriggers();
  const { data: tagsData } = useTriggerTags();
  const { data: triggerSourcesData } = useTriggerSources();

  const createTrigger = useCreateTrigger();
  const updateTrigger = useUpdateTrigger();
  const deleteTrigger = useDeleteTrigger();
  const reorderTrigger = useReorderTrigger();
  const createTriggerGroup = useCreateTriggerGroup();
  const updateTriggerGroup = useUpdateTriggerGroup();
  const deleteTriggerGroup = useDeleteTriggerGroup();
  const createTriggerTag = useCreateTriggerTag();
  const deleteTriggerTag = useDeleteTriggerTag();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [copiedTrigger, setCopiedTrigger] = useState<Omit<TriggerConfig, "id"> | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");
  const [draggedTriggerId, setDraggedTriggerId] = useState<string | null>(null);
  const [dragTargetTriggerId, setDragTargetTriggerId] = useState<string | null>(null);

  const [newTriggerDraft, setNewTriggerDraft] = useState<{
    name: string;
    sourceId: string;
    eventId: string;
    active: boolean;
  } | null>(null);
  const [isTriggerTypeDropdownOpen, setIsTriggerTypeDropdownOpen] = useState(false);
  const [triggerTypeSearchText, setTriggerTypeSearchText] = useState("");
  const [highlightedTriggerTypeIndex, setHighlightedTriggerTypeIndex] = useState(0);
  const triggerTypeDropdownRef = useRef<HTMLDivElement | null>(null);
  const triggerTypeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [triggerEditDraft, setTriggerEditDraft] = useState<{
    groupId?: string;
    triggerId: string;
  } | null>(null);
  const [newTagDraft, setNewTagDraft] = useState<{
    groupId?: string;
    trigger: TriggerConfig;
    value: string;
  } | null>(null);
  const [setRenameDraft, setSetRenameDraft] = useState<{ groupId: string; name: string } | null>(
    null
  );
  const [newTriggerSetDraft, setNewTriggerSetDraft] = useState<TriggerSetDraft | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const mainTriggers = useMemo(() => data?.mainTriggers ?? [], [data?.mainTriggers]);
  const groups = useMemo(() => data?.groups ?? [], [data?.groups]);

  useEffect(() => {
    if (!selectedGroupId) {
      return;
    }

    const exists = groups.some((group) => group.id === selectedGroupId);
    if (!exists) {
      setSelectedGroupId(undefined);
    }
  }, [groups, selectedGroupId]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId),
    [groups, selectedGroupId]
  );

  const triggerTypeOptions = useMemo<TriggerTypeOption[]>(
    () =>
      (triggerSourcesData ?? []).flatMap((source) =>
        source.events.map((event) => ({
          sourceId: source.id,
          sourceName: source.name,
          eventId: event.id,
          eventName: event.name,
          description: event.description,
        }))
      ),
    [triggerSourcesData]
  );

  const triggerTypeLabelLookup = useMemo(() => {
    const map = new Map<string, string>();
    triggerTypeOptions.forEach((option) => {
      map.set(`${option.sourceId}:${option.eventId}`, `${option.sourceName} | ${option.eventName}`);
    });
    return map;
  }, [triggerTypeOptions]);

  const visibleTriggers = selectedGroup ? selectedGroup.triggers : mainTriggers;
  const selectedTitle = selectedGroup ? selectedGroup.name : "General Triggers";

  const availableTags = useMemo(() => {
    const tags = new Set<string>([...(tagsData ?? []), ...(data?.sortTags ?? [])]);

    mainTriggers.forEach((trigger) => {
      (trigger.tags ?? []).forEach((tag) => tags.add(tag));
    });

    groups.forEach((group) => {
      group.triggers.forEach((trigger) => {
        (trigger.tags ?? []).forEach((tag) => tags.add(tag));
      });
    });

    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [data?.sortTags, groups, mainTriggers, tagsData]);

  useEffect(() => {
    if (selectedTagFilter === "all") {
      return;
    }

    if (!availableTags.includes(selectedTagFilter)) {
      setSelectedTagFilter("all");
    }
  }, [availableTags, selectedTagFilter]);

  const filteredTriggers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return visibleTriggers.filter((trigger) => {
      const triggerTags = trigger.tags ?? [];
      const tagMatches = selectedTagFilter === "all" || triggerTags.includes(selectedTagFilter);

      if (!tagMatches) {
        return false;
      }

      if (!normalizedSearch.length) {
        return true;
      }

      return [trigger.name ?? "", trigger.sourceId, trigger.eventId, ...triggerTags]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [searchText, selectedTagFilter, visibleTriggers]);

  const filteredTriggerTypeOptions = useMemo(() => {
    const normalizedQuery = triggerTypeSearchText.trim().toLowerCase();
    if (!normalizedQuery.length) {
      return triggerTypeOptions;
    }

    return triggerTypeOptions.filter((option) =>
      [option.sourceName, option.eventName, option.description ?? "", option.sourceId, option.eventId]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [triggerTypeSearchText, triggerTypeOptions]);

  const selectedTriggerTypeOption = useMemo(() => {
    if (!newTriggerDraft) {
      return null;
    }

    return triggerTypeOptions.find(
      (option) =>
        option.sourceId === newTriggerDraft.sourceId && option.eventId === newTriggerDraft.eventId
    );
  }, [newTriggerDraft, triggerTypeOptions]);

  const closeTriggerTypeDropdown = () => {
    setIsTriggerTypeDropdownOpen(false);
    setTriggerTypeSearchText("");
    setHighlightedTriggerTypeIndex(0);
  };

  const selectTriggerType = (option: TriggerTypeOption) => {
    setNewTriggerDraft((previous) =>
      previous
        ? {
            ...previous,
            sourceId: option.sourceId,
            eventId: option.eventId,
            name: option.eventName,
          }
        : previous
    );

    closeTriggerTypeDropdown();
    triggerTypeButtonRef.current?.focus();
  };

  useEffect(() => {
    if (!isTriggerTypeDropdownOpen) {
      return;
    }

    const selectedIndex = filteredTriggerTypeOptions.findIndex(
      (option) =>
        option.sourceId === selectedTriggerTypeOption?.sourceId &&
        option.eventId === selectedTriggerTypeOption?.eventId
    );

    setHighlightedTriggerTypeIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [filteredTriggerTypeOptions, isTriggerTypeDropdownOpen, selectedTriggerTypeOption]);

  useEffect(() => {
    if (!isTriggerTypeDropdownOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!triggerTypeDropdownRef.current) {
        return;
      }

      if (!triggerTypeDropdownRef.current.contains(event.target as Node)) {
        closeTriggerTypeDropdown();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [isTriggerTypeDropdownOpen]);

  const pasteTriggerIntoSelection = async () => {
    if (!copiedTrigger) {
      return;
    }

    await createTrigger.mutateAsync({
      groupId: selectedGroup?.id,
      trigger: {
        ...copiedTrigger,
        actionWorkflow: {
          ...copiedTrigger.actionWorkflow,
          id: uuid(),
        },
      },
    });
  };

  const openNewTriggerModal = () => {
    const firstOption = triggerTypeOptions[0];
    if (!firstOption) {
      return;
    }

    setNewTriggerDraft({
      name: firstOption.eventName,
      sourceId: firstOption.sourceId,
      eventId: firstOption.eventId,
      active: true,
    });
    closeTriggerTypeDropdown();
  };

  const submitNewTrigger = async () => {
    if (!newTriggerDraft) {
      return;
    }

    const normalizedName = newTriggerDraft.name.trim();
    if (!normalizedName.length) {
      return;
    }

    await createTrigger.mutateAsync({
      groupId: selectedGroup?.id,
      trigger: createBlankTrigger(
        normalizedName,
        newTriggerDraft.sourceId,
        newTriggerDraft.eventId,
        newTriggerDraft.active
      ),
    });

    setNewTriggerDraft(null);
    closeTriggerTypeDropdown();
  };

  const submitNewTriggerSet = async () => {
    if (!newTriggerSetDraft) {
      return;
    }

    const normalizedName = newTriggerSetDraft.name.trim();
    if (!normalizedName.length) {
      return;
    }

    const createdGroup = await createTriggerGroup.mutateAsync(normalizedName);
    setSelectedGroupId(createdGroup.id);
    setNewTriggerSetDraft(null);
  };

  const updateTriggerTags = (
    trigger: TriggerConfig,
    groupId: string | undefined,
    tags: string[]
  ) => {
    updateTrigger.mutate({
      groupId,
      triggerId: trigger.id,
      triggerUpdate: {
        tags,
      },
    });
  };

  const submitConfirmAction = async () => {
    if (!confirmAction) {
      return;
    }

    if (confirmAction.type === "delete-trigger") {
      await deleteTrigger.mutateAsync({
        groupId: confirmAction.groupId,
        triggerId: confirmAction.triggerId,
      });
      setConfirmAction(null);
      return;
    }

    if (confirmAction.type === "delete-set") {
      await deleteTriggerGroup.mutateAsync(confirmAction.groupId);
      setConfirmAction(null);
      return;
    }

    await deleteTriggerTag.mutateAsync(confirmAction.tag);
    setConfirmAction(null);
  };

  if (isLoading) {
    return <div className="p-4">Loading triggers...</div>;
  }

  return (
    <div className="h-full p-3">
      <div className="h-full border rounded-md overflow-hidden flex">
        <div className={`${sidebarCollapsed ? "w-12" : "w-72"} border-r transition-all`}>
          <div className="h-12 border-b flex items-center justify-between px-2">
            {!sidebarCollapsed && <div className="font-semibold text-sm">Trigger Sets</div>}
            <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed((p) => !p)}>
              {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <div className="p-2 space-y-3">
              <Button
                variant={selectedGroupId == null ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedGroupId(undefined)}
              >
                <Rows3 className="mr-2" />
                General Triggers
              </Button>

              <div className="space-y-1">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center gap-1">
                    <Button
                      variant={selectedGroupId === group.id ? "secondary" : "ghost"}
                      className="flex-1 justify-start"
                      onClick={() => setSelectedGroupId(group.id)}
                    >
                      {group.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateTriggerGroup.mutate({
                          groupId: group.id,
                          groupUpdate: { active: !group.active },
                        })
                      }
                      title={group.active ? "Disable set" : "Enable set"}
                    >
                      <span
                        className={`size-2 rounded-full ${group.active ? "bg-green-500" : "bg-zinc-500"}`}
                      />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t space-y-2">
                <Button
                  className="w-full"
                  onClick={() => setNewTriggerSetDraft({ name: "" })}
                  disabled={createTriggerGroup.isPending}
                >
                  <FolderPlus className="mr-2" />
                  Add Trigger Set
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="h-12 border-b px-3 flex items-center justify-between gap-3">
            <div className="font-semibold">{selectedTitle}</div>
            <div className="flex items-center gap-2">
              <Button
                onClick={openNewTriggerModal}
                disabled={createTrigger.isPending || triggerTypeOptions.length === 0}
              >
                <Plus className="mr-2" />
                New Trigger
              </Button>
              <Button variant="outline" disabled>
                Simulate Trigger
              </Button>
            </div>
          </div>

          <div className="p-3 space-y-3 overflow-auto">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative grow min-w-[260px]">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 opacity-50" />
                <Input
                  className="pl-8"
                  placeholder="Search triggers..."
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </div>
              <select
                className="h-9 rounded-md border bg-input/30 px-2 text-sm min-w-[180px]"
                value={selectedTagFilter}
                onChange={(event) => setSelectedTagFilter(event.target.value)}
              >
                <option value="all">All tags</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            {filteredTriggers.length === 0 ? (
              <div className="text-sm opacity-70">
                {visibleTriggers.length === 0
                  ? "No triggers in this set."
                  : "No triggers match this search/tag filter."}
              </div>
            ) : (
              filteredTriggers.map((trigger) => {
                const absoluteIndex = visibleTriggers.findIndex(
                  (candidate) => candidate.id === trigger.id
                );

                return (
                  <TriggerRow
                    key={trigger.id}
                    trigger={trigger}
                    triggerIndex={absoluteIndex}
                    totalTriggers={visibleTriggers.length}
                    triggerTypeLabel={
                      triggerTypeLabelLookup.get(`${trigger.sourceId}:${trigger.eventId}`) ??
                      `${trigger.sourceId} / ${trigger.eventId}`
                    }
                    inGroupId={selectedGroup?.id}
                    groups={groups}
                    copiedTrigger={copiedTrigger}
                    availableTags={availableTags}
                    isDragTarget={dragTargetTriggerId === trigger.id}
                    onDragStart={() => {
                      setDraggedTriggerId(trigger.id);
                      setDragTargetTriggerId(trigger.id);
                    }}
                    onDragEnd={() => {
                      setDraggedTriggerId(null);
                      setDragTargetTriggerId(null);
                    }}
                    onDragOver={() => {
                      if (!draggedTriggerId || draggedTriggerId === trigger.id) {
                        return;
                      }
                      setDragTargetTriggerId(trigger.id);
                    }}
                    onKeyboardReorder={(targetIndex) => {
                      reorderTrigger.mutate({
                        groupId: selectedGroup?.id,
                        triggerId: trigger.id,
                        targetIndex,
                      });
                    }}
                    onDrop={() => {
                      if (!draggedTriggerId || draggedTriggerId === trigger.id) {
                        setDraggedTriggerId(null);
                        setDragTargetTriggerId(null);
                        return;
                      }

                      const sourceAbsoluteIndex = visibleTriggers.findIndex(
                        (candidate) => candidate.id === draggedTriggerId
                      );
                      const targetAbsoluteIndex = visibleTriggers.findIndex(
                        (candidate) => candidate.id === trigger.id
                      );

                      if (sourceAbsoluteIndex !== -1 && targetAbsoluteIndex !== -1) {
                        reorderTrigger.mutate({
                          groupId: selectedGroup?.id,
                          triggerId: draggedTriggerId,
                          targetIndex: targetAbsoluteIndex,
                        });
                      }

                      setDraggedTriggerId(null);
                      setDragTargetTriggerId(null);
                    }}
                    onToggle={() =>
                      updateTrigger.mutate({
                        groupId: selectedGroup?.id,
                        triggerId: trigger.id,
                        triggerUpdate: { active: !trigger.active },
                      })
                    }
                    onEdit={() => {
                      setTriggerEditDraft({
                        groupId: selectedGroup?.id,
                        triggerId: trigger.id,
                      });
                    }}
                    onDuplicate={() =>
                      createTrigger.mutate({
                        groupId: selectedGroup?.id,
                        trigger: cloneTrigger(trigger),
                      })
                    }
                    onCopy={() => {
                      setCopiedTrigger({
                        ...trigger,
                        actionWorkflow: {
                          ...trigger.actionWorkflow,
                          id: uuid(),
                        },
                      });
                    }}
                    onPaste={pasteTriggerIntoSelection}
                    onDelete={() => {
                      setConfirmAction({
                        type: "delete-trigger",
                        groupId: selectedGroup?.id,
                        triggerId: trigger.id,
                        message: "Delete this trigger?",
                      });
                    }}
                    onMove={async ({ groupId }) => {
                      await createTrigger.mutateAsync({
                        groupId,
                        trigger: {
                          ...trigger,
                          actionWorkflow: {
                            ...trigger.actionWorkflow,
                            id: uuid(),
                          },
                        },
                      });
                      await deleteTrigger.mutateAsync({
                        groupId: selectedGroup?.id,
                        triggerId: trigger.id,
                      });
                      setSelectedGroupId(groupId);
                    }}
                    onReorder={(targetIndex) => {
                      reorderTrigger.mutate({
                        groupId: selectedGroup?.id,
                        triggerId: trigger.id,
                        targetIndex,
                      });
                    }}
                    onAddTag={(tag) => {
                      const normalizedTag = normalizeTag(tag);
                      if (!normalizedTag.length) {
                        return;
                      }

                      if (!availableTags.includes(normalizedTag)) {
                        createTriggerTag.mutate(normalizedTag);
                      }

                      const nextTags = Array.from(new Set([...(trigger.tags ?? []), normalizedTag])).sort(
                        (a, b) => a.localeCompare(b)
                      );

                      updateTriggerTags(trigger, selectedGroup?.id, nextTags);
                    }}
                    onRequestAddTag={() => {
                      setNewTagDraft({
                        groupId: selectedGroup?.id,
                        trigger,
                        value: "",
                      });
                    }}
                    onRemoveTag={(tag) => {
                      const nextTags = (trigger.tags ?? []).filter(
                        (candidateTag) => candidateTag !== tag
                      );
                      updateTriggerTags(trigger, selectedGroup?.id, nextTags);
                    }}
                    onDeleteTagFromSystem={(tag) => {
                      setConfirmAction({
                        type: "delete-tag",
                        tag,
                        message: `Delete tag "${tag}" from all triggers?`,
                      });
                    }}
                  />
                );
              })
            )}

            {selectedGroup && (
              <div className="pt-2 border-t flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSetRenameDraft({
                      groupId: selectedGroup.id,
                      name: selectedGroup.name,
                    });
                  }}
                >
                  Rename Set
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setConfirmAction({
                      type: "delete-set",
                      groupId: selectedGroup.id,
                      message: "Delete this trigger set?",
                    });
                  }}
                >
                  Delete Set
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {newTriggerSetDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md border bg-background p-4 space-y-4">
            <div className="font-semibold text-lg">Add Trigger Set</div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Name</div>
              <Input
                autoFocus
                placeholder="Enter name"
                value={newTriggerSetDraft.name}
                onChange={(event) =>
                  setNewTriggerSetDraft((previous) =>
                    previous
                      ? {
                          ...previous,
                          name: event.target.value,
                        }
                      : previous
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void submitNewTriggerSet();
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    setNewTriggerSetDraft(null);
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewTriggerSetDraft(null)}>
                Cancel
              </Button>
              <Button
                onClick={submitNewTriggerSet}
                disabled={createTriggerGroup.isPending || !newTriggerSetDraft.name.trim().length}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {newTriggerDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-md border bg-background p-4 space-y-4">
            <div className="font-semibold text-lg">Add New Trigger</div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Trigger On</div>
              <div className="relative" ref={triggerTypeDropdownRef}>
                <button
                  ref={triggerTypeButtonRef}
                  type="button"
                  className="w-full h-9 rounded-md border bg-input/30 px-3 text-left text-sm"
                  onClick={() => setIsTriggerTypeDropdownOpen((open) => !open)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setIsTriggerTypeDropdownOpen(true);
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                      closeTriggerTypeDropdown();
                    }
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={isTriggerTypeDropdownOpen}
                  aria-controls="trigger-type-options"
                >
                  {selectedTriggerTypeOption
                    ? `${selectedTriggerTypeOption.eventName}`
                    : "Select or search for an event..."}
                </button>

                {isTriggerTypeDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
                    <input
                      placeholder="Search events..."
                      value={triggerTypeSearchText}
                      onChange={(event) => setTriggerTypeSearchText(event.target.value)}
                      autoFocus
                      className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      onKeyDown={(event) => {
                        if (!filteredTriggerTypeOptions.length) {
                          if (event.key === "Escape") {
                            event.preventDefault();
                            closeTriggerTypeDropdown();
                            triggerTypeButtonRef.current?.focus();
                          }
                          return;
                        }

                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          setHighlightedTriggerTypeIndex((previous) =>
                            Math.min(previous + 1, filteredTriggerTypeOptions.length - 1)
                          );
                        }

                        if (event.key === "ArrowUp") {
                          event.preventDefault();
                          setHighlightedTriggerTypeIndex((previous) => Math.max(previous - 1, 0));
                        }

                        if (event.key === "Enter") {
                          event.preventDefault();
                          const highlightedOption =
                            filteredTriggerTypeOptions[highlightedTriggerTypeIndex] ??
                            filteredTriggerTypeOptions[0];
                          if (highlightedOption) {
                            selectTriggerType(highlightedOption);
                          }
                        }

                        if (event.key === "Escape") {
                          event.preventDefault();
                          closeTriggerTypeDropdown();
                          triggerTypeButtonRef.current?.focus();
                        }
                      }}
                    />

                    <div
                      id="trigger-type-options"
                      role="listbox"
                      className="mt-2 max-h-56 overflow-auto rounded-md border"
                    >
                      {filteredTriggerTypeOptions.length === 0 && (
                        <div className="px-3 py-2 text-sm opacity-70">No matching events</div>
                      )}

                      {filteredTriggerTypeOptions.map((option, index) => {
                        const isSelected =
                          newTriggerDraft.sourceId === option.sourceId &&
                          newTriggerDraft.eventId === option.eventId;
                        const isHighlighted = highlightedTriggerTypeIndex === index;

                        return (
                          <button
                            key={`${option.sourceId}:${option.eventId}`}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            className={`w-full text-left px-3 py-2 border-b last:border-b-0 ${
                              isHighlighted || isSelected ? "bg-accent" : "hover:bg-accent/60"
                            }`}
                            onMouseEnter={() => setHighlightedTriggerTypeIndex(index)}
                            onClick={() => selectTriggerType(option)}
                          >
                            <div className="font-medium">{option.eventName}</div>
                            <div className="text-xs opacity-70">
                              {option.sourceName}
                              {option.description ? ` | ${option.description}` : ""}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Name</div>
              <Input
                placeholder="Enter name"
                value={newTriggerDraft.name}
                onChange={(event) =>
                  setNewTriggerDraft((previous) =>
                    previous
                      ? {
                          ...previous,
                          name: event.target.value,
                        }
                      : previous
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Settings</div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newTriggerDraft.active}
                  onChange={(event) =>
                    setNewTriggerDraft((previous) =>
                      previous
                        ? {
                            ...previous,
                            active: event.target.checked,
                          }
                        : previous
                    )
                  }
                />
                Is Enabled
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNewTriggerDraft(null);
                  closeTriggerTypeDropdown();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={submitNewTrigger}
                disabled={createTrigger.isPending || !newTriggerDraft.name.trim().length}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {triggerEditDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md border bg-background p-4 space-y-3">
            <div className="font-semibold">Edit Trigger</div>
            <div className="text-sm opacity-70">
              The trigger editor is coming soon. This is where you will configure effects and other
              actions that fire when this trigger runs.
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setTriggerEditDraft(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {newTagDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md border bg-background p-4 space-y-3">
            <div className="font-semibold">Add Tag</div>
            <Input
              placeholder="Tag name"
              value={newTagDraft.value}
              onChange={(event) =>
                setNewTagDraft((previous) =>
                  previous
                    ? {
                        ...previous,
                        value: event.target.value,
                      }
                    : previous
                )
              }
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewTagDraft(null)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const normalizedTag = normalizeTag(newTagDraft.value);
                  if (!normalizedTag.length) {
                    return;
                  }

                  if (!availableTags.includes(normalizedTag)) {
                    await createTriggerTag.mutateAsync(normalizedTag);
                  }

                  const nextTags = Array.from(
                    new Set([...(newTagDraft.trigger.tags ?? []), normalizedTag])
                  ).sort((a, b) => a.localeCompare(b));

                  updateTriggerTags(newTagDraft.trigger, newTagDraft.groupId, nextTags);
                  setNewTagDraft(null);
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {setRenameDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md border bg-background p-4 space-y-3">
            <div className="font-semibold">Rename Trigger Set</div>
            <Input
              placeholder="Set name"
              value={setRenameDraft.name}
              onChange={(event) =>
                setSetRenameDraft((previous) =>
                  previous
                    ? {
                        ...previous,
                        name: event.target.value,
                      }
                    : previous
                )
              }
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSetRenameDraft(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  updateTriggerGroup.mutate({
                    groupId: setRenameDraft.groupId,
                    groupUpdate: { name: setRenameDraft.name },
                  });
                  setSetRenameDraft(null);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-md border bg-background p-4 space-y-3">
            <div className="font-semibold">Confirm</div>
            <div className="text-sm opacity-90">{confirmAction.message}</div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={submitConfirmAction}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TriggersPage;
