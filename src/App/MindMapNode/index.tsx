import { Button, Drawer } from "antd";
import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { Handle, NodeProps, Position } from "reactflow";

import { yStore, wsProvider } from "../y";
import * as Y from "yjs";
import { QuillBinding } from "y-quill";
import Quill from "quill";
import QuillCursors from "quill-cursors";

import DragIcon from "./DragIcon";
import { useRFContext } from "../../context";

export type NodeData = {
  label: string;
  text?: string;
  textId?: string;
};

function MindMapNode({ id, data }: NodeProps<NodeData>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setEditorVisible, setEditorYText, editorVisible, editorYText } =
    useRFContext();

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 1);
  }, []);

  // const [open, setOpen] = useState(false);
  const [ytext, setYText] = useState<any>(null);

  const showDrawer = () => {
    setEditorYText(ytext);
    setEditorVisible(true);
  };

  const onClose = () => {
    setEditorVisible(false);
  };

  useEffect(() => {
    if (data.textId) {
      yStore.nodes.forEach((node) => {
        if (node.get("id") === data.textId) {
          setYText((node.get("data") as any).get("text"));
        }
      });
    }
    yStore.nodes.observe((r) => {
      if (data.textId) {
        yStore.nodes.forEach((node) => {
          if (node.get("id") === data.textId) {
            setYText((node.get("data") as any).get("text"));
          }
        });
      }
    });
  }, [data.textId]);

  return (
    <>
      <div className="inputWrapper">
        <div className="dragHandle">
          <DragIcon />
        </div>
        <Button type="primary" onClick={showDrawer} className="nodrag">
          Open
        </Button>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Top} />
    </>
  );
}

export default MindMapNode;
