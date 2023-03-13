import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const TimeBasedPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Time-Based" />
    </PageWrapper>
})

export default TimeBasedPage;