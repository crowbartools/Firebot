import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@heroicons/react/16/solid";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";

export const NewCommandPage: React.FC = observer(() => {
  const router = useRouter();
  return (
    <PageWrapper>
      <Button outline onClick={() => router.back()} className="mb-2">
        <ArrowLeftIcon />
        Back
      </Button>
      <PageTitle title="New Command" />
      {/* <Button>Edit Actions</Button> */}
    </PageWrapper>
  );
});

export default NewCommandPage;
