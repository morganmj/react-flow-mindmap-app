import { createContext, useState } from "react";
import { createContainer } from "./App/utils/useContainer";

const useInnerContext = () => {
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorYText, setEditorYText] = useState<any>(null);

  return {
    editorVisible,
    setEditorVisible,
    editorYText,
    setEditorYText,
  };
};

const container = createContainer(useInnerContext);

export const RFContextProvider = container.Provider;

export const useRFContext = container.useContainer;
