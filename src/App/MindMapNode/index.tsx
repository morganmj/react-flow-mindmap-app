import { Button, Drawer } from "antd";
import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { Handle, NodeProps, Position } from "reactflow";

import useStore from "../store";
import { yStore } from "../y";
import * as Y from "yjs";

import DragIcon from "./DragIcon";

export type NodeData = {
  label: string;
};

// let quill: any = null;
// let binding: any = null;

// const bindEditor = (ytext) => {
//   if (binding) {
//     // We can reuse the existing editor. But we need to remove all event handlers
//     // that we registered for collaborative editing before binding to a new editor binding
//     binding.destroy();
//   }
//   if (quill === null) {
//     // This is the first time a user opens a document.
//     // The editor has not been initialized yet.
//     // Create an editor instance.
//     quill = new Quill(document.querySelector("#editor"), {
//       modules: {
//         cursors: true,
//         toolbar: [
//           // adding some basic Quill content features
//           [{ header: [1, 2, false] }],
//           ["bold", "italic", "underline"],
//           ["image", "code-block"],
//         ],
//         history: {
//           // Local undo shouldn't undo changes
//           // from remote users
//           userOnly: true,
//         },
//       },
//       placeholder: "Start collaborating...",
//       theme: "snow", // 'bubble' is also great
//     });
//   }
//   // "Bind" the quill editor to a Yjs text type.
//   // The QuillBinding uses the awareness instance to propagate your cursor location.
//   binding = new QuillBinding(ytext, quill, awareness);
// };

function MindMapNode({ id, data }: NodeProps<NodeData>) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 1);
  }, []);

  // useLayoutEffect(() => {
  //   if (inputRef.current) {
  //     inputRef.current.style.width = `${data.label.length * 8}px`;
  //   }
  // }, [data.label.length]);

  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    console.log("23333");
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  return (
    <>
      <div className="inputWrapper">
        <div className="dragHandle">
          <DragIcon />
        </div>
        {/* <input
          value={data.label}
          onChange={(evt) => yStore.updateNodeLabel(id, evt.target.value)}
          className="input"
          ref={inputRef}
        />       */}
        <Button type="primary" onClick={showDrawer} className="nodrag">
          Open
        </Button>{" "}
      </div>
      <Drawer
        title="Basic Drawer"
        placement="right"
        onClose={onClose}
        open={open}
      >
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Drawer>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Top} />
    </>
  );
}

export default MindMapNode;
