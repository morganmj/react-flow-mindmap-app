import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  ConnectionLineType,
  NodeOrigin,
  Node,
  OnConnectEnd,
  OnConnectStart,
  useReactFlow,
  useStoreApi,
  Controls,
  Panel,
  Edge,
} from "reactflow";

import { wsProvider, yStore, yUndoManager } from "./y";

import MindMapNode from "./MindMapNode";
import MindMapEdge from "./MindMapEdge";

// we need to import the React Flow styles to make it work
import "reactflow/dist/style.css";
import { ReactFlowYStore, useYArray } from "./y";
import { useLazy } from "./utils/useLazy";
import { useRFContext } from "../context";
import { Button, Drawer } from "antd";
import { QuillBinding } from "y-quill";
import Quill from "quill";
import QuillCursors from "quill-cursors";
import * as Y from "yjs";
const nodeTypes = {
  mindmap: MindMapNode,
};

const edgeTypes = {
  mindmap: MindMapEdge,
};

const nodeOrigin: NodeOrigin = [0.5, 0.5];

const connectionLineStyle = { stroke: "#F6AD55", strokeWidth: 3 };
const defaultEdgeOptions = { style: connectionLineStyle, type: "mindmap" };

let quill: any = null;
let binding: any = null;
Quill.register("modules/cursors", QuillCursors);

const bindEditor = (ytext: Y.Text) => {
  console.log('ytext',ytext)
  // if (binding) {
  //   // We can reuse the existing editor. But we need to remove all event handlers
  //   // that we registered for collaborative editing before binding to a new editor binding
  //   binding.destroy();
  // }
  if (quill === null) {
    // This is the first time a user opens a document.
    // The editor has not been initialized yet.
    // Create an editor instance.
    quill = new Quill(document.querySelector("#quill-editor")!, {
      modules: {
        cursors: true,
        toolbar: [
          // adding some basic Quill content features
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline"],
          ["image", "code-block"],
        ],
        history: {
          // Local undo shouldn't undo changes
          // from remote users
          userOnly: true,
        },
      },
      placeholder: "Start collaborating...",
      theme: "snow", // 'bubble' is also great
    });
  }
  // "Bind" the quill editor to a Yjs text type.
  // The QuillBinding uses the awareness instance to propagate your cursor location.
  // binding = new QuillBinding(ytext, quill, wsProvider.awareness);
  binding = new QuillBinding(ytext, quill, wsProvider.awareness);
};

function Flow(): JSX.Element {
  const store = useStoreApi();
  const { setEditorVisible, editorVisible, editorYText } = useRFContext();
  const nodes = useYArray(yStore.nodes);
  const edges = useYArray(yStore.edges);

  // console.log('yStore',yStore.doc.store)

  const { project } = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);

  const getChildNodePosition = (event: MouseEvent, parentNode?: Node) => {
    const { domNode } = store.getState();

    if (
      !domNode ||
      // we need to check if these properites exist, because when a node is not initialized yet,
      // it doesn't have a positionAbsolute nor a width or height
      !parentNode?.positionAbsolute ||
      !parentNode?.width ||
      !parentNode?.height
    ) {
      return;
    }

    const { top, left } = domNode.getBoundingClientRect();

    // we need to remove the wrapper bounds, in order to get the correct mouse position
    const panePosition = project({
      x: event.clientX - left,
      y: event.clientY - top,
    });

    // we are calculating with positionAbsolute here because child nodes are positioned relative to their parent
    return {
      x: panePosition.x - parentNode.positionAbsolute.x + parentNode.width / 2,
      y: panePosition.y - parentNode.positionAbsolute.y + parentNode.height / 2,
    };
  };

  const onConnectStart: OnConnectStart = useCallback((_, { nodeId }) => {
    // we need to remember where the connection started so we can add the new node to the correct parent on connect end
    connectingNodeId.current = nodeId;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const { nodeInternals } = store.getState();
      const targetIsPane = (event.target as Element).classList.contains(
        "react-flow__pane"
      );
      const node = (event.target as Element).closest(".react-flow__node");

      if (node) {
        // node.querySelector("input")?.focus({ preventScroll: true });
      } else if (targetIsPane && connectingNodeId.current) {
        const parentNode = nodeInternals.get(connectingNodeId.current);
        const childNodePosition = getChildNodePosition(event, parentNode);

        if (parentNode && childNodePosition) {
          yStore.addChildNode(parentNode, childNodePosition);
        }
      }
    },
    [getChildNodePosition]
  );

  return (
    <>
      <ReactFlow
        nodes={nodes as any}
        edges={edges as any}
        onNodesChange={(e) => yStore.onNodesChange(e)}
        onEdgesChange={(e) => yStore.onEdgesChange(e)}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodeOrigin={nodeOrigin}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineStyle={connectionLineStyle}
        connectionLineType={ConnectionLineType.Straight}
        fitView
        // elementsSelectable={false}
        // onNodeClick={()=>{

        // }}
      >
        <Controls showInteractive={false} />
        <Panel position="top-left" className="header">
          React Flow Mind Map
          <Button onClick={() => yUndoManager.undo()}>undo</Button>
        </Panel>
      </ReactFlow>
      <Drawer
        title="Basic Drawer"
        placement="right"
        onClose={() => {
          binding.destroy();
          setEditorVisible(false);
        }}
        afterOpenChange={(open) => {
          if (open) {
            bindEditor(editorYText);
          } else {
            // binding.destroy();
          }
        }}
        open={editorVisible}
      >
        <div id="quill-editor"></div>
      </Drawer>
    </>
  );
}

export default Flow;
