import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const ViewersPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Viewers" />
    </PageWrapper>
})

export default ViewersPage;