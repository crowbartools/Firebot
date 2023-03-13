import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const ChannelRewardsPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Channel Rewards" />
    </PageWrapper>
})

export default ChannelRewardsPage;