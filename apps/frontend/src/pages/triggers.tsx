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
import { useActionTypes } from "@/hooks/api/workflows/useActionTypes";
import { useTestWorkflow } from "@/hooks/api/workflows/useTestWorkflow";
import {
  FirebotActionType,
  FirebotActionWorkflow,
  TriggerConfig,
  TriggerGroup,
} from "firebot-types";
import {
  ClipboardPaste,
  Copy,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  FolderPlus,
  GripVertical,
  Pencil,
  Play,
  Plus,
  Rows3,
  Search,
  Trash2,
} from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
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

type EditableAction = {
  id: string;
  actionType: string;
  parameters: Record<string, unknown>;
};

type TriggerEditDraft = {
  groupId?: string;
  triggerId: string;
  sourceId: string;
  eventId: string;
  name: string;
  active: boolean;
  actions: EditableAction[];
};

type ActionEditDraft = {
  actionId: string;
};

type ActionSelectorDraft = {
  mode: "add" | "change";
  actionId?: string;
  searchText: string;
  selectedCategory: string;
  selectedActionTypeId: string;
};

type TriggerSelectorDraft = {
  searchText: string;
  selectedPlatform: string;
  selectedTriggerKey: string;
};

function inferPlatformFromSourceId(sourceId: string): string {
  const normalized = sourceId.toLowerCase();
  if (normalized.includes("twitch")) {
    return "Twitch";
  }
  if (normalized.includes("youtube")) {
    return "YouTube";
  }
  if (normalized.includes("kick")) {
    return "Kick";
  }
  if (normalized.includes("trovo")) {
    return "Trovo";
  }
  return "Core";
}

function getLinearActionsFromWorkflow(workflow: FirebotActionWorkflow): EditableAction[] {
  const triggerNode = workflow.nodes.find((node) => node.type === "trigger");
  if (triggerNode == null) {
    return [];
  }

  const actionNodesById = new Map(
    workflow.nodes
      .filter((node): node is Extract<(typeof workflow.nodes)[number], { type: "action" }> =>
        node.type === "action"
      )
      .map((node) => [node.id, node])
  );

  const edgeBySourceNodeId = new Map<string, typeof workflow.edges[number][]>();
  for (const edge of workflow.edges) {
    const existing = edgeBySourceNodeId.get(edge.source.nodeId) ?? [];
    existing.push(edge);
    edgeBySourceNodeId.set(edge.source.nodeId, existing);
  }

  const orderedActions: EditableAction[] = [];
  const visited = new Set<string>();

  let nextEdge = (edgeBySourceNodeId.get(triggerNode.id) ?? []).find(
    (edge) => edge.source.outcome === "triggered"
  );

  while (nextEdge != null) {
    const nextAction = actionNodesById.get(nextEdge.target.nodeId);
    if (nextAction == null || visited.has(nextAction.id)) {
      break;
    }

    visited.add(nextAction.id);
    orderedActions.push({
      id: nextAction.id,
      actionType: nextAction.actionType,
      parameters: (nextAction.schema?.parameters as Record<string, unknown>) ?? {},
    });

    const outgoing = edgeBySourceNodeId.get(nextAction.id) ?? [];
    nextEdge = outgoing.find((edge) => edge.source.outcome === "complete") ?? outgoing[0];
  }

  return orderedActions;
}

function buildLinearWorkflowFromActions(
  workflow: FirebotActionWorkflow,
  actions: EditableAction[]
): FirebotActionWorkflow {
  const triggerNode = workflow.nodes.find((node) => node.type === "trigger") ?? {
    id: uuid(),
    type: "trigger" as const,
    position: { x: 0, y: 0 },
    schema: {
      outcomes: [{ slug: "triggered" as const }],
    },
  };

  const actionNodes = actions.map((action, index) => ({
    id: action.id,
    type: "action" as const,
    actionType: action.actionType,
    position: { x: 260 * (index + 1), y: 0 },
    schema: {
      parameters: action.parameters,
    },
  }));

  const firstEdge =
    actions.length > 0
      ? [
          {
            id: uuid(),
            source: {
              nodeId: triggerNode.id,
              outcome: "triggered",
            },
            target: {
              nodeId: actions[0].id,
            },
          },
        ]
      : [];

  const sequenceEdges = actions.slice(0, -1).map((action, index) => ({
    id: uuid(),
    source: {
      nodeId: action.id,
      outcome: "complete",
    },
    target: {
      nodeId: actions[index + 1].id,
    },
  }));

  return {
    ...workflow,
    nodes: [triggerNode, ...actionNodes],
    edges: [...firstEdge, ...sequenceEdges],
  };
}

function getActionTypeDefaultParameters(actionType?: FirebotActionType): Record<string, unknown> {
  if (actionType?.parameters == null) {
    return {};
  }

  const params: Record<string, unknown> = {};

  for (const category of Object.values(actionType.parameters)) {
    for (const [parameterId, parameter] of Object.entries(category.parameters)) {
      if ("default" in parameter) {
        params[parameterId] = parameter.default;
      }
    }
  }

  return params;
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
  const { data: actionTypes } = useActionTypes();

  const createTrigger = useCreateTrigger();
  const updateTrigger = useUpdateTrigger();
  const deleteTrigger = useDeleteTrigger();
  const reorderTrigger = useReorderTrigger();
  const createTriggerGroup = useCreateTriggerGroup();
  const updateTriggerGroup = useUpdateTriggerGroup();
  const deleteTriggerGroup = useDeleteTriggerGroup();
  const createTriggerTag = useCreateTriggerTag();
  const deleteTriggerTag = useDeleteTriggerTag();
  const testWorkflow = useTestWorkflow();

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

  const [triggerEditDraft, setTriggerEditDraft] = useState<TriggerEditDraft | null>(null);
  const [triggerSelectorDraft, setTriggerSelectorDraft] = useState<TriggerSelectorDraft | null>(
    null
  );
  const [actionEditDraft, setActionEditDraft] = useState<ActionEditDraft | null>(null);
  const [actionSelectorDraft, setActionSelectorDraft] = useState<ActionSelectorDraft | null>(null);
  const [copiedActions, setCopiedActions] = useState<EditableAction[] | null>(null);
  const [draggedActionId, setDraggedActionId] = useState<string | null>(null);
  const [dragTargetActionId, setDragTargetActionId] = useState<string | null>(null);
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
  const themedSelectClassName =
    "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";
  const themedOptionClassName = "bg-background text-foreground";

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

  const triggerPlatformOptions = useMemo(() => {
    const platforms = new Set<string>();
    triggerTypeOptions.forEach((option) => {
      platforms.add(inferPlatformFromSourceId(option.sourceId));
    });
    return ["All", ...Array.from(platforms).sort((a, b) => a.localeCompare(b))];
  }, [triggerTypeOptions]);

  const selectableTriggerTypes = useMemo(() => {
    if (!triggerSelectorDraft) {
      return [];
    }

    const normalizedSearch = triggerSelectorDraft.searchText.trim().toLowerCase();

    return triggerTypeOptions.filter((option) => {
      const platform = inferPlatformFromSourceId(option.sourceId);

      if (
        triggerSelectorDraft.selectedPlatform !== "All" &&
        platform !== triggerSelectorDraft.selectedPlatform
      ) {
        return false;
      }

      if (!normalizedSearch.length) {
        return true;
      }

      return [
        option.sourceName,
        option.eventName,
        option.description ?? "",
        option.sourceId,
        option.eventId,
        platform,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [triggerSelectorDraft, triggerTypeOptions]);

  const visibleTriggers = selectedGroup ? selectedGroup.triggers : mainTriggers;
  const selectedTitle = selectedGroup ? selectedGroup.name : "General Triggers";

  const actionTypeCategories = useMemo(() => {
    const categories = new Set<string>();
    (actionTypes ?? []).forEach((actionType) => {
      categories.add(actionType.category?.trim().length ? actionType.category : "Common");
    });
    return ["All", ...Array.from(categories).sort((a, b) => a.localeCompare(b))];
  }, [actionTypes]);

  const selectableActionTypes = useMemo(() => {
    if (!actionSelectorDraft) {
      return [];
    }

    const normalizedSearch = actionSelectorDraft.searchText.trim().toLowerCase();

    return (actionTypes ?? []).filter((actionType) => {
      const category = actionType.category?.trim().length ? actionType.category : "Common";
      if (
        actionSelectorDraft.selectedCategory !== "All" &&
        category !== actionSelectorDraft.selectedCategory
      ) {
        return false;
      }

      if (!normalizedSearch.length) {
        return true;
      }

      return [actionType.name, actionType.description, actionType.id, category]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [actionSelectorDraft, actionTypes]);

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

  const openTriggerSelector = () => {
    if (!triggerEditDraft) {
      return;
    }

    setTriggerSelectorDraft({
      searchText: "",
      selectedPlatform: "All",
      selectedTriggerKey: `${triggerEditDraft.sourceId}:${triggerEditDraft.eventId}`,
    });
  };

  const closeTriggerSelector = () => {
    setTriggerSelectorDraft(null);
  };

  const applyTriggerSelector = () => {
    if (!triggerSelectorDraft) {
      return;
    }

    const [sourceId, eventId] = triggerSelectorDraft.selectedTriggerKey.split(":");
    if (!sourceId?.length || !eventId?.length) {
      return;
    }

    setTriggerEditDraft((previous) =>
      previous
        ? {
            ...previous,
            sourceId,
            eventId,
          }
        : previous
    );
    closeTriggerSelector();
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

  const triggerBeingEdited = useMemo(() => {
    if (!triggerEditDraft) {
      return null;
    }

    return [...mainTriggers, ...groups.flatMap((group) => group.triggers)].find(
      (trigger) => trigger.id === triggerEditDraft.triggerId
    );
  }, [groups, mainTriggers, triggerEditDraft]);

  const addActionToDraft = (actionTypeId: string, replaceActionId?: string) => {
    if (!triggerEditDraft || !actionTypeId.length) {
      return;
    }

    const actionType = actionTypes?.find((type) => type.id === actionTypeId);
    const nextParameters = getActionTypeDefaultParameters(actionType);

    if (replaceActionId) {
      setTriggerEditDraft((previous) =>
        previous
          ? {
              ...previous,
              actions: previous.actions.map((action) =>
                action.id === replaceActionId
                  ? {
                      ...action,
                      actionType: actionTypeId,
                      parameters: nextParameters,
                    }
                  : action
              ),
            }
          : previous
      );
      return;
    }

    setTriggerEditDraft((previous) =>
      previous
        ? {
            ...previous,
            actions: [
              ...previous.actions,
              {
                id: uuid(),
                actionType: actionTypeId,
                parameters: nextParameters,
              },
            ],
          }
        : previous
    );
  };

  const openActionSelector = (mode: "add" | "change", actionId?: string) => {
    const currentAction =
      mode === "change" && actionId
        ? triggerEditDraft?.actions.find((action) => action.id === actionId)
        : undefined;

    setActionSelectorDraft({
      mode,
      actionId,
      searchText: "",
      selectedCategory: "All",
      selectedActionTypeId: currentAction?.actionType ?? "",
    });
  };

  const closeActionSelector = () => {
    setActionSelectorDraft(null);
  };

  const submitActionSelector = () => {
    if (!actionSelectorDraft?.selectedActionTypeId.length) {
      return;
    }

    if (actionSelectorDraft.mode === "change" && actionSelectorDraft.actionId) {
      addActionToDraft(actionSelectorDraft.selectedActionTypeId, actionSelectorDraft.actionId);
      closeActionSelector();
      return;
    }

    addActionToDraft(actionSelectorDraft.selectedActionTypeId);
    closeActionSelector();
  };

  const copyAllDraftActions = () => {
    if (!triggerEditDraft) {
      return;
    }

    const clonedActions = triggerEditDraft.actions.map((action) => ({
      ...action,
      parameters: JSON.parse(JSON.stringify(action.parameters ?? {})) as Record<string, unknown>,
    }));

    setCopiedActions(clonedActions);
  };

  const pasteAllDraftActions = () => {
    if (!copiedActions || copiedActions.length === 0) {
      return;
    }

    setTriggerEditDraft((previous) =>
      previous
        ? {
            ...previous,
            actions: [
              ...previous.actions,
              ...copiedActions.map((action) => ({
                ...action,
                id: uuid(),
                parameters: JSON.parse(
                  JSON.stringify(action.parameters ?? {})
                ) as Record<string, unknown>,
              })),
            ],
          }
        : previous
    );
  };

  const clearDraftActions = () => {
    setTriggerEditDraft((previous) =>
      previous
        ? {
            ...previous,
            actions: [],
          }
        : previous
    );
    setActionEditDraft(null);
    setDraggedActionId(null);
    setDragTargetActionId(null);
  };

  const removeActionFromDraft = (actionId: string) => {
    setTriggerEditDraft((previous) =>
      previous
        ? {
            ...previous,
            actions: previous.actions.filter((action) => action.id !== actionId),
          }
        : previous
    );

    setDraggedActionId((previous) => (previous === actionId ? null : previous));
    setDragTargetActionId((previous) => (previous === actionId ? null : previous));
    setActionEditDraft((previous) => (previous?.actionId === actionId ? null : previous));
  };

  const reorderDraftAction = (fromIndex: number, toIndex: number) => {
    setTriggerEditDraft((previous) => {
      if (!previous) {
        return previous;
      }

      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= previous.actions.length ||
        toIndex >= previous.actions.length ||
        fromIndex === toIndex
      ) {
        return previous;
      }

      const actions = [...previous.actions];
      const [moved] = actions.splice(fromIndex, 1);
      actions.splice(toIndex, 0, moved);

      return {
        ...previous,
        actions,
      };
    });
  };

  const handleActionDrop = (targetActionId: string) => {
    if (!triggerEditDraft || !draggedActionId || draggedActionId === targetActionId) {
      setDraggedActionId(null);
      setDragTargetActionId(null);
      return;
    }

    const fromIndex = triggerEditDraft.actions.findIndex((action) => action.id === draggedActionId);
    const toIndex = triggerEditDraft.actions.findIndex((action) => action.id === targetActionId);

    if (fromIndex !== -1 && toIndex !== -1) {
      reorderDraftAction(fromIndex, toIndex);
    }

    setDraggedActionId(null);
    setDragTargetActionId(null);
  };

  const openActionEditModal = (actionId: string) => {
    const action = triggerEditDraft?.actions.find((candidate) => candidate.id === actionId);
    if (!action) {
      return;
    }

    setActionEditDraft({
      actionId,
    });
  };

  const submitTriggerEdit = async () => {
    if (!triggerEditDraft || !triggerBeingEdited) {
      return;
    }

    const nextWorkflow = buildLinearWorkflowFromActions(
      triggerBeingEdited.actionWorkflow,
      triggerEditDraft.actions
    );

    await updateTrigger.mutateAsync({
      groupId: triggerEditDraft.groupId,
      triggerId: triggerEditDraft.triggerId,
      triggerUpdate: {
        sourceId: triggerEditDraft.sourceId,
        eventId: triggerEditDraft.eventId,
        name: triggerEditDraft.name,
        active: triggerEditDraft.active,
        actionWorkflow: nextWorkflow,
      },
    });

    setTriggerEditDraft(null);
    setTriggerSelectorDraft(null);
    setActionEditDraft(null);
    setActionSelectorDraft(null);
    setDraggedActionId(null);
    setDragTargetActionId(null);
  };

  const testTriggerDraftWorkflow = async () => {
    if (!triggerEditDraft || !triggerBeingEdited) {
      return;
    }

    const nextWorkflow = buildLinearWorkflowFromActions(
      triggerBeingEdited.actionWorkflow,
      triggerEditDraft.actions
    );

    await testWorkflow.mutateAsync({
      actionTriggerType: "event-trigger",
      workflow: nextWorkflow,
    });
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
                className={`${themedSelectClassName} min-w-[180px]`}
                value={selectedTagFilter}
                onChange={(event) => setSelectedTagFilter(event.target.value)}
              >
                <option className={themedOptionClassName} value="all">
                  All tags
                </option>
                {availableTags.map((tag) => (
                  <option className={themedOptionClassName} key={tag} value={tag}>
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
                        sourceId: trigger.sourceId,
                        eventId: trigger.eventId,
                        name: trigger.name ?? "",
                        active: trigger.active,
                        actions: getLinearActionsFromWorkflow(trigger.actionWorkflow),
                      });
                      setTriggerSelectorDraft(null);
                      setActionEditDraft(null);
                      setActionSelectorDraft(null);
                      setDraggedActionId(null);
                      setDragTargetActionId(null);
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
          <div className="w-full max-w-4xl rounded-md border bg-background p-4 space-y-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-lg">Edit Trigger</div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => void testTriggerDraftWorkflow()}
                disabled={testWorkflow.isPending}
                title="Simulate trigger"
              >
                <Play />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Trigger On</div>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={openTriggerSelector}
                >
                  <span>
                    {triggerTypeLabelLookup.get(
                      `${triggerEditDraft.sourceId}:${triggerEditDraft.eventId}`
                    ) ?? `${triggerEditDraft.sourceId} / ${triggerEditDraft.eventId}`}
                  </span>
                  <Ellipsis />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Name</div>
                <Input
                  value={triggerEditDraft.name}
                  onChange={(event) =>
                    setTriggerEditDraft((previous) =>
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
                <div className="text-sm font-medium">Filters</div>
                <div className="text-sm opacity-70">
                  There are no filters available for this trigger type yet.
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Settings</div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={triggerEditDraft.active}
                    onChange={(event) =>
                      setTriggerEditDraft((previous) =>
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
            </div>

            <div className="rounded-md border bg-secondary/30 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">Manage Actions</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Actions area menu">
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={copyAllDraftActions}>
                      <Copy />
                      Copy all actions
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!copiedActions || copiedActions.length === 0}
                      onSelect={pasteAllDraftActions}
                    >
                      <ClipboardPaste />
                      Paste actions
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={triggerEditDraft.actions.length === 0}
                      onSelect={clearDraftActions}
                    >
                      <Trash2 />
                      Delete all actions
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                {triggerEditDraft.actions.length === 0 && (
                  <div className="text-sm opacity-70">No actions yet. Add one below.</div>
                )}

                {triggerEditDraft.actions.map((action, index) => {
                  const actionType = actionTypes?.find((type) => type.id === action.actionType);
                  const canMoveUp = index > 0;
                  const canMoveDown = index < triggerEditDraft.actions.length - 1;

                  return (
                    <div
                      key={action.id}
                      className={`rounded-md border bg-background px-3 py-2 grid grid-cols-[auto_1fr_auto] gap-2 items-center ${
                        dragTargetActionId === action.id ? "ring-1 ring-primary" : ""
                      }`}
                      onDrop={() => handleActionDrop(action.id)}
                      onDragOver={(event) => {
                        event.preventDefault();
                        if (!draggedActionId || draggedActionId === action.id) {
                          return;
                        }
                        setDragTargetActionId(action.id);
                      }}
                    >
                      <button
                        type="button"
                        draggable
                        onDragStart={() => {
                          setDraggedActionId(action.id);
                          setDragTargetActionId(action.id);
                        }}
                        onDragEnd={() => {
                          setDraggedActionId(null);
                          setDragTargetActionId(null);
                        }}
                        className="size-8 inline-flex items-center justify-center rounded-sm opacity-60 hover:opacity-100"
                        title="Reorder action"
                        aria-label="Reorder action"
                      >
                        <GripVertical className="size-4" />
                      </button>

                      <div className="flex items-center gap-2">
                        {actionType != null && (
                          <div className="size-8 rounded-md bg-secondary/70 flex items-center justify-center">
                            <DynamicIcon name={actionType.icon} size={16} />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{actionType?.name ?? action.actionType}</div>
                          <div className="text-xs opacity-70">{action.actionType}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openActionEditModal(action.id)}
                          title="Edit action settings"
                        >
                          <Pencil />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Action options">
                              <Ellipsis />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={!canMoveUp}
                              onSelect={() => reorderDraftAction(index, 0)}
                            >
                              Move to top
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!canMoveUp}
                              onSelect={() => reorderDraftAction(index, index - 1)}
                            >
                              Move up
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!canMoveDown}
                              onSelect={() => reorderDraftAction(index, index + 1)}
                            >
                              Move down
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!canMoveDown}
                              onSelect={() =>
                                reorderDraftAction(index, triggerEditDraft.actions.length - 1)
                              }
                            >
                              Move to bottom
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => removeActionFromDraft(action.id)}
                            >
                              <Trash2 />
                              Remove action
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <Button variant="outline" className="w-full" onClick={() => openActionSelector("add")}>
                  <Plus className="mr-1" />
                  Add Action
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTriggerEditDraft(null);
                  setTriggerSelectorDraft(null);
                  setActionEditDraft(null);
                  setActionSelectorDraft(null);
                  setDraggedActionId(null);
                  setDragTargetActionId(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => void submitTriggerEdit()} disabled={updateTrigger.isPending}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {actionEditDraft && triggerEditDraft && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-md border bg-background p-4 space-y-3">
            <div className="font-semibold">Edit Action</div>
            <div className="text-sm opacity-70">
              Action-specific settings editor is coming soon. This placeholder modal will be replaced
              with the full action configuration UI.
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActionEditDraft(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {actionSelectorDraft && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-4xl h-[80vh] max-h-[90vh] rounded-md border bg-background overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <div className="font-semibold text-2xl">Select New Action</div>
              <Input
                className="mt-3"
                placeholder="Search actions..."
                value={actionSelectorDraft.searchText}
                onChange={(event) =>
                  setActionSelectorDraft((previous) =>
                    previous
                      ? {
                          ...previous,
                          searchText: event.target.value,
                        }
                      : previous
                  )
                }
              />
            </div>

            <div className="grid grid-cols-[220px_1fr] min-h-0 flex-1">
              <div className="border-r p-3 overflow-auto">
                <div className="text-sm font-semibold mb-2">Categories</div>
                <div className="space-y-1">
                  {actionTypeCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                        actionSelectorDraft.selectedCategory === category
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/40"
                      }`}
                      onClick={() =>
                        setActionSelectorDraft((previous) =>
                          previous
                            ? {
                                ...previous,
                                selectedCategory: category,
                              }
                            : previous
                        )
                      }
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 overflow-auto space-y-2">
                {selectableActionTypes.length === 0 ? (
                  <div className="text-sm opacity-70">No actions found for this filter.</div>
                ) : (
                  selectableActionTypes.map((actionType) => {
                    const isSelected = actionSelectorDraft.selectedActionTypeId === actionType.id;

                    return (
                      <button
                        key={actionType.id}
                        type="button"
                        className={`w-full text-left rounded-md border p-3 ${
                          isSelected ? "border-primary ring-1 ring-primary/50" : "hover:bg-accent/30"
                        }`}
                        onClick={() =>
                          setActionSelectorDraft((previous) =>
                            previous
                              ? {
                                  ...previous,
                                  selectedActionTypeId: actionType.id,
                                }
                              : previous
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-md bg-secondary/70 flex items-center justify-center shrink-0">
                            <DynamicIcon name={actionType.icon} size={16} />
                          </div>
                          <div>
                            <div className="font-medium">{actionType.name}</div>
                            <div className="text-sm opacity-80">{actionType.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-between gap-3">
              <div>
                <div className="text-xs opacity-70">Selected Action</div>
                <div className="font-medium">
                  {actionTypes?.find((type) => type.id === actionSelectorDraft.selectedActionTypeId)?.name ??
                    "None"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={closeActionSelector}>
                  Cancel
                </Button>
                <Button
                  onClick={submitActionSelector}
                  disabled={!actionSelectorDraft.selectedActionTypeId.length}
                >
                  Select
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {triggerSelectorDraft && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-3xl h-[75vh] max-h-[90vh] rounded-md border bg-background overflow-hidden flex flex-col">
            <div className="p-4 border-b space-y-3">
              <div className="font-semibold text-xl">Select Trigger Type</div>
              <div className="grid gap-2 md:grid-cols-[1fr_220px]">
                <Input
                  placeholder="Search triggers..."
                  value={triggerSelectorDraft.searchText}
                  onChange={(event) =>
                    setTriggerSelectorDraft((previous) =>
                      previous
                        ? {
                            ...previous,
                            searchText: event.target.value,
                          }
                        : previous
                    )
                  }
                />
                <select
                  className={themedSelectClassName}
                  value={triggerSelectorDraft.selectedPlatform}
                  onChange={(event) =>
                    setTriggerSelectorDraft((previous) =>
                      previous
                        ? {
                            ...previous,
                            selectedPlatform: event.target.value,
                          }
                        : previous
                    )
                  }
                >
                  {triggerPlatformOptions.map((platform) => (
                    <option className={themedOptionClassName} key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 overflow-auto flex-1 space-y-2">
              {selectableTriggerTypes.length === 0 ? (
                <div className="text-sm opacity-70">No triggers found for this filter.</div>
              ) : (
                selectableTriggerTypes.map((option) => {
                  const optionKey = `${option.sourceId}:${option.eventId}`;
                  const platform = inferPlatformFromSourceId(option.sourceId);
                  const isSelected = triggerSelectorDraft.selectedTriggerKey === optionKey;

                  return (
                    <button
                      key={optionKey}
                      type="button"
                      className={`w-full text-left rounded-md border p-3 ${
                        isSelected ? "border-primary ring-1 ring-primary/50" : "hover:bg-accent/30"
                      }`}
                      onClick={() =>
                        setTriggerSelectorDraft((previous) =>
                          previous
                            ? {
                                ...previous,
                                selectedTriggerKey: optionKey,
                              }
                            : previous
                        )
                      }
                    >
                      <div className="font-medium">{option.eventName}</div>
                      <div className="text-sm opacity-80">{option.sourceName}</div>
                      <div className="text-xs opacity-70 mt-1">Platform: {platform}</div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <Button variant="outline" onClick={closeTriggerSelector}>
                Cancel
              </Button>
              <Button onClick={applyTriggerSelector}>Select</Button>
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
