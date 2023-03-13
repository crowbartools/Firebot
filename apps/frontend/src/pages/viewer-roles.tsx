import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const ViewerRolesPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Viewer Roles" />
    </PageWrapper>
})

export default ViewerRolesPage;