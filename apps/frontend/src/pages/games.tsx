import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const GamesPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Games" />
    </PageWrapper>
})

export default GamesPage;