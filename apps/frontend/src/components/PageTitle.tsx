
import { Heading } from "./ui/heading";

type Props = {
    title: string;
    actions?: React.ReactNode;
}

export const PageTitle: React.FC<Props> = (({ title, actions }) => {
    return <div className="flex w-full flex-wrap items-end justify-between gap-4 border-b border-zinc-950/10 pb-6 dark:border-white/10 mb-8">
      <Heading>{title}</Heading>
      {!!actions && <div className="flex gap-4">
        {actions}
      </div>}
    </div>
});