import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const QueuesPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Queues" />
    </PageWrapper>
})

export default QueuesPage;