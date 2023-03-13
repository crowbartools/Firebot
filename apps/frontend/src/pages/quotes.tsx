import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const QuotesPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Quotes" />
    </PageWrapper>
})

export default QuotesPage;