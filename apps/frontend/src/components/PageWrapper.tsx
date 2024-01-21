import clsx from "clsx";

type Props = {
    children: React.ReactNode,
    innerClassName?: string,
}

export const PageWrapper: React.FC<Props> = ({ children, innerClassName }) => {
    return (
      <div className="w-full h-full pb-3 pr-3 overflow-y-scroll">
        <div
          className={clsx(
            "bg-secondary-bg h-full rounded-xl p-4",
            innerClassName
          )}
        >
          {children}
        </div>
      </div>
    );
};