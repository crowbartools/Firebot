import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const HotkeysPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Hotkeys" />
    </PageWrapper>
})

export default HotkeysPage;