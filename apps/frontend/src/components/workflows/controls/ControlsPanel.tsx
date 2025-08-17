import { Panel, useReactFlow, useViewport } from "@xyflow/react";
import { Button } from "../../ui/button";
import {
  ChevronDown,
  Expand,
  Hand,
  MousePointer2,
  Search,
  StickyNote,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { useActionWorkflowEditor } from "../ActionWorkflowEditorContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { Badge } from "../../ui/badge";
import { useKey } from "react-use";
import { Separator } from "../../ui/separator";
import { Organize } from "./Organize";
import { TestWorkflow } from "./TestWorkflow";

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function ControlsPanel() {
  const { cursorMode, setCursorMode } = useActionWorkflowEditor();

  const { fitView, zoomTo } = useReactFlow();

  const { zoom: currentZoom } = useViewport();

  const currentZoomPercentage = Math.round(currentZoom * 100);

  const nearestZoomLevel = ZOOM_LEVELS.reduce((prev, curr) => {
    return Math.abs(curr - currentZoom) < Math.abs(prev - currentZoom)
      ? curr
      : prev;
  }, ZOOM_LEVELS[0]);

  const nearestZoomIndex = ZOOM_LEVELS.indexOf(nearestZoomLevel);

  const isMaxZoom = nearestZoomIndex === ZOOM_LEVELS.length - 1;
  const isMinZoom = nearestZoomIndex === 0;

  const zoomIn = () => {
    if (isMaxZoom) return;
    const newZoom = ZOOM_LEVELS[nearestZoomIndex + 1];
    zoomTo(newZoom, { duration: 200 });
  };

  const zoomOut = () => {
    if (isMinZoom) return;
    const newZoom = ZOOM_LEVELS[nearestZoomIndex - 1];
    zoomTo(newZoom, { duration: 200 });
  };

  useKey(
    "h",
    () => {
      console.log("Setting cursor mode to drag");
      setCursorMode("drag");
    },
    {},
    [setCursorMode]
  );

  useKey(
    "v",
    () => {
      console.log("Setting cursor mode to pointer");
      setCursorMode("pointer");
    },
    {},
    [setCursorMode]
  );

  return (
    <Panel
      position="bottom-center"
      className="p-2 bg-secondary rounded-xl gap-x-2 flex"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={"sm"}
            className="min-w-28 flex items-center justify-between"
          >
            <Search /> {currentZoomPercentage}% <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            disabled={isMaxZoom}
            onClick={(event) => {
              event.preventDefault();
              zoomIn();
            }}
          >
            <ZoomIn /> Zoom in
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isMinZoom}
            onClick={(event) => {
              event.preventDefault();
              zoomOut();
            }}
          >
            <ZoomOut /> Zoom out
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(event) => {
              event.preventDefault();
              zoomTo(1.0, { duration: 200 });
            }}
          >
            <Search /> Zoom to 100%
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fitView({ duration: 500 })}>
            <Expand /> Fit to view
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant={cursorMode === "drag" ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setCursorMode("drag")}
          >
            <Hand />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Drag mode{" "}
            <Badge variant="outline" className="text-muted-foreground">
              H
            </Badge>
          </p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <Button
            variant={cursorMode === "pointer" ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setCursorMode("pointer")}
          >
            <MousePointer2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Pointer mode{" "}
            <Badge variant="outline" className="text-muted-foreground">
              V
            </Badge>
          </p>
        </TooltipContent>
      </Tooltip>

      <div>
        <Separator orientation="vertical" className="" />
      </div>

      <Tooltip>
        <TooltipTrigger>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled>
            <StickyNote />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add note</p>
        </TooltipContent>
      </Tooltip>

      <div>
        <Separator orientation="vertical" className="" />
      </div>

      <Organize />

      <div>
        <Separator orientation="vertical" className="" />
      </div>

      <TestWorkflow />
    </Panel>
  );
}
