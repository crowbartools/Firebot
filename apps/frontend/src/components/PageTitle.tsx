
import { Heading } from "./ui/heading";

type Props = {
    title: string
}

export const PageTitle: React.FC<Props> = (({ title }) => {
    return <div className="flex w-full flex-wrap items-end justify-between gap-4 border-b border-zinc-950/10 pb-6 dark:border-white/10 mb-8">
      <Heading>{title}</Heading>
      {/* <div className="flex gap-4">
        <Button outline>Refund</Button>
        <Button>Resend invoice</Button>
      </div> */}
    </div>
});