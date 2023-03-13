import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const ModerationPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Moderation" />
    </PageWrapper>
})

export default ModerationPage;