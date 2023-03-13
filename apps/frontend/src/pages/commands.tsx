import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const CommandsPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Commands" />
    </PageWrapper>
})

export default CommandsPage;