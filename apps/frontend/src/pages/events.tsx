import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const EventsPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Events" />
    </PageWrapper>
})

export default EventsPage;