import { HandleProps, Position } from "@xyflow/react";
import { BaseHandle } from "./BaseHandle";
import { AnimatePresence, motion } from "motion/react";

const wrapperClassNames: Record<Position, string> = {
  [Position.Top]:
    "flex-col-reverse left-1/2 -translate-y-full -translate-x-1/2",
  [Position.Bottom]: "flex-col left-1/2 translate-y-[13px] -translate-x-1/2",
  [Position.Left]:
    "flex-row-reverse top-1/2 -translate-x-full -translate-y-1/2",
  [Position.Right]: "top-1/2 -translate-y-1/2 translate-x-[13px]",
};

export const ButtonHandle = ({
  showButton = true,
  position = Position.Bottom,
  children,
  ...props
}: HandleProps & { showButton?: boolean }) => {
  const wrapperClassName = wrapperClassNames[position || Position.Bottom];
  const vertical = position === Position.Top || position === Position.Bottom;

  return (
    <BaseHandle position={position} id={props.id} {...props}>
      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, y: vertical ? -10 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: vertical ? -10 : 10 }}
            transition={{ duration: 0.2 }}
            className={`absolute flex items-center ${wrapperClassName}`}
          >
            <div
              className={`bg-gray-300 ${vertical ? "h-1.5 w-[1px] my-0.5" : "h-[1px] w-1.5 mx-0.5"}`}
            />
            <div className="nodrag nopan pointer-events-auto">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </BaseHandle>
  );
};
