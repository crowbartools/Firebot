import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { observer } from "mobx-react-lite";

export const CurrencyPage: React.FC = observer(() => {
    return <PageWrapper>
        <PageTitle title="Currency" />
    </PageWrapper>
})

export default CurrencyPage;