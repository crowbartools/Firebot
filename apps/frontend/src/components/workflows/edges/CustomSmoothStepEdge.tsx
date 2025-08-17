import React from "react";
import { type EdgeProps, SmoothStepEdge } from "@xyflow/react";

export function CustomSmoothStepEdge(props: EdgeProps) {
  const selected = props.selected;
  return (
    <>
      <defs>
        <marker
          id="endMarker"
          markerWidth="20"
          markerHeight="20"
          viewBox="-10 -10 20 20"
          markerUnits="strokeWidth"
          orient="auto-start-reverse"
          refX="0"
          refY="0"
        >
          <polyline
            stroke={
              selected
                ? "var(--xy-edge-stroke-selected, var(--xy-edge-stroke-selected-default))"
                : "var(--xy-edge-stroke, var(--xy-edge-stroke-default))"
            }
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1"
            fill="none"
            points="-6,-6 0,0 -6,6"
          ></polyline>
        </marker>
      </defs>
      <SmoothStepEdge {...props} markerEnd={"url(#endMarker)"} />
    </>
  );
}
