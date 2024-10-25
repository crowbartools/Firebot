import { SearchBar } from "@/components/controls/Searchbar";
import { PageTitle } from "@/components/PageTitle";
import { PageWrapper } from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/16/solid";
import { observer } from "mobx-react-lite";

export const CommandsPage: React.FC = observer(() => {
  return (
    <PageWrapper>
      <PageTitle
        title="Commands"
        actions={
          <>
            <SearchBar />
            <Button color="blue" href="/commands/new-command"><PlusIcon />Create Command</Button>
          </>
        }
      />
    </PageWrapper>
  );
});

export default CommandsPage;
