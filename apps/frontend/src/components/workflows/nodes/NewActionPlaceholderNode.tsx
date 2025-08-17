import { memo } from "react";
import { PlaceholderNode } from "./PlaceholderNode";

const NewActionPlaceholderNode = memo(() => {
  return (
    <PlaceholderNode>
      <div>+</div>
    </PlaceholderNode>
  );
});

NewActionPlaceholderNode.displayName = "NewActionPlaceholderNode";

export default NewActionPlaceholderNode;
