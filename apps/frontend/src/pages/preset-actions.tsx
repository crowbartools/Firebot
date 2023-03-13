import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const PresetActionsPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Preset Actions" />
    </PageWrapper>
})

export default PresetActionsPage;