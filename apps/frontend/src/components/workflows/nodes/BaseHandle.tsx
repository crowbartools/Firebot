import { forwardRef } from "react";
import { Handle, HandleProps } from "@xyflow/react";
import clsx from "clsx";

export type BaseHandleProps = HandleProps;

export const BaseHandle = forwardRef<HTMLDivElement, BaseHandleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Handle
        ref={ref}
        {...props}
        className={clsx(
          "!h-[12px] !w-[12px] rounded-full border transition !border-blue-500 !bg-secondary",
          className
        )}
        {...props}
      >
        {children}
      </Handle>
    );
  }
);

BaseHandle.displayName = "BaseHandle";
