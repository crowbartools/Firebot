import { SlideOver } from "@/components/controls/SlideOver";
import { useActiveProfile } from "@/hooks/api/use-active-profile";
import { useStreamingPlatforms } from "@/hooks/api/use-streaming-platforms";

export const ManageProfileSlideOver: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { data: streamingPlatforms } = useStreamingPlatforms();
  const { data: activeProfile } = useActiveProfile();

  return (
    <SlideOver title={activeProfile?.name} open={open} onClose={onClose}>
      <div>
        <h3 className="text-lg font-bold text-primary-text">Platforms</h3>
        <div>
          {streamingPlatforms.map((platform) => (
            <div
              className="p-4 rounded-lg flex items-center justify-between"
              style={
                platform.color
                  ? {
                      backgroundColor: platform.color.bg,
                      color: platform.color.text,
                    }
                  : undefined
              }
              key={platform.id}
            >
              <span className="text-lg font-bold">{platform.name}</span>
              <button className="text-gray-100">Connect</button>
            </div>
          ))}
        </div>
      </div>
    </SlideOver>
  );
};
