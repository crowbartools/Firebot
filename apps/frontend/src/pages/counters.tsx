import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const CountersPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Counters" />
    </PageWrapper>
})

export default CountersPage;