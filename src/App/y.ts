import * as Y from "yjs";
import {
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  XYPosition,
} from "reactflow";
import { NodeData } from "./MindMapNode";
import { applyChangesWithSyncedStore } from "./utils/change";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { WebsocketProvider } from "y-websocket";

export class ReactFlowYStore {
  doc!: Y.Doc;
  nodes!: Y.Array<Node<NodeData>>;
  edges!: Y.Array<Edge>;
  instance?: ReactFlowYStore;
  constructor(initalNodes: Node<NodeData>[]) {
    if (this.instance) {
      return this.instance
    }
    this.instance = this;

    this.doc = new Y.Doc();
    this.nodes = this.doc.getArray("nodes");
    this.edges = this.doc.getArray("edges");
    this.nodes.push(initalNodes);
  }

  onNodesChange = (changes: NodeChange[]) => {
    applyChangesWithSyncedStore(changes, this.nodes!, this.doc!);
  };
  onEdgesChange = (changes: EdgeChange[]) => {
    applyChangesWithSyncedStore(changes, this.edges!, this.doc!);
  };
  addChildNode = (parentNode: Node, position: XYPosition) => {
    const newNode = {
      id: nanoid(),
      type: "mindmap",
      data: { label: "New Node" },
      position,
      dragHandle: ".dragHandle",
      parentNode: parentNode.id,
    };

    const newEdge = {
      id: nanoid(),
      source: parentNode.id,
      target: newNode.id,
    };

    const _this = this;
    this.doc.transact(() => {
      _this.nodes.push([newNode]);
      _this.edges.push([newEdge]);
    });
  };

  updateNodeLabel = (nodeId: string, label: string) => {
    let deletedIndex = -1;
    let updateItem: any;
    this.nodes.forEach((node, index) => {
      if (node.id === nodeId) {
        updateItem = { ...node, data:{...node.data,label} };
        deletedIndex = index;
      }
    });

    if (deletedIndex >= 0) {
      console.log('updateNodeLabel',deletedIndex,updateItem)
      this.doc.transact(() => {
        this.nodes.delete(deletedIndex, 1);
        this.nodes.push([updateItem]);
      });
    }
  };
}

export const yStore = new ReactFlowYStore([
  {
    id: "root",
    type: "mindmap",
    data: { label: "React Flow Mind Map" },
    position: { x: 0, y: 0 },
    dragHandle: ".dragHandle",
  },
]);

export function useYArray<T>(yArray: Y.Array<T>, initialValue?: T[]): T[] {
  const [arr, setArr] = useState(initialValue || yArray.toArray());

  useEffect(() => {
    const f=(event: Y.YArrayEvent<T>) => {
      // if (event.changes.keys.size === 0) {
      //   // skip empty event
      //   return;
      // }
      let retain = 0;
      event.changes.delta.forEach((change) => {
        if (change.retain) {
          retain += change.retain;
        }
        if (change.delete) {
          arr.splice(retain, change.delete);
        }
        if (change.insert) {
          console.log('change.insert',change.insert)
          if (Array.isArray(change.insert)) {
            const value = change.insert;
            arr.splice(retain, 0, ...value);
          } else {
            arr.splice(retain, 0, change.insert as T);
          }
          retain += change.insert.length;
        }
      });
      setArr([...arr]);
    }
     yArray.observe(f);

    return () => yArray.unobserve(f);
  }, [yArray]);

  return arr;
}

// const doc = getYjsDoc(yStore);
export const wsProvider = new WebsocketProvider(
  "wss://demos.yjs.dev/",
  "999",
  yStore.doc
);

export const disconnect = () => wsProvider.disconnect();
export const connect = () => wsProvider.connect();
