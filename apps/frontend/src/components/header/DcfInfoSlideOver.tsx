import { DeviceCodeResponse } from "@/lib/api/resources/auth-provider";
import {
  FbSlideOverContent,
  useShowSlideOverBuilder,
} from "../slideover/FbSlideOverContext";
import { FirebotAccountType } from "firebot-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRealTimeEvent } from "@/hooks/api/use-realtime-event";

type DcfInfoSlideOverParams = {
  dcfCodeDetails: DeviceCodeResponse;
  accountType: FirebotAccountType;
  providerId: string;
  streamingPlatformName: string;
};

export const useDcfInfoSlideOver = () => {
  return useShowSlideOverBuilder<DcfInfoSlideOverParams>({
    content: DcfInfoSlideOverContent,
    title: "Login Info",
    showDismissButton: true,
    disableClickAway: true,
  });
};

const DcfInfoSlideOverContent: FbSlideOverContent<DcfInfoSlideOverParams> = ({
  params,
  onDismiss,
}) => {
  useRealTimeEvent<{ providerId: string }>("device-flow-finished", () => {
    onDismiss();
  });

  return (
    <div>
      <h3 className="text-lg font-bold text-primary-foreground">
        Let&apos;s log into your {params.streamingPlatformName}{" "}
        <b>{params.accountType}</b> account!
      </h3>
      <p className="text-primary-foreground mt-2 mb-5">
        Please copy the below URL into your browser to connect your{" "}
        {params.streamingPlatformName} {params.accountType} account.
      </p>
      <div className="rounded-sm bg-background overflow-hidden text-primary-foreground">
        <div className="bg-card text-sm h-12 flex items-center px-2">
          <a
            href={params.dcfCodeDetails.verificationUri}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-500 underline"
          >
            {params.dcfCodeDetails.verificationUri}
          </a>
        </div>
        <div className="p-2 text-center gap-y-4 flex flex-col items-center justify-center">
          <span className="block text-primary-foreground/50 text-sm">
            When you open the URL, please verify the code below:
          </span>
          <span className="block font-mono text-2xl">
            {params.dcfCodeDetails.code}
          </span>
          <div>
            <FontAwesomeIcon
              className="w-10 animate-spin"
              icon={["fas", "circle-notch"]}
            />
          </div>
          <span className="block text-primary-foreground/50 text-sm">
            Waiting for login confirmation...
          </span>
        </div>
      </div>
    </div>
  );
};
