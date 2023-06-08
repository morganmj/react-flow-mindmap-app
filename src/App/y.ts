import * as Y from "yjs";
import { Edge, EdgeChange, Node, NodeChange, XYPosition } from "reactflow";
import { NodeData } from "./MindMapNode";
import { applyChangesWithSyncedStore } from "./utils/change";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "./yindex";

export class ReactFlowYStore {
  doc!: Y.Doc;
  nodes!: Y.Array<Y.Map<unknown>>;
  edges!: Y.Array<Y.Map<unknown>>;
  instance?: ReactFlowYStore;
  constructor(initialNodes?: Y.Map<unknown>) {
    if (this.instance) {
      return this.instance;
    }
    this.instance = this;

    this.doc = new Y.Doc();
    this.nodes = this.doc.getArray("nodes");
    this.edges = this.doc.getArray("edges");
    const yMap = new Y.Map([
      ["id", "root"],
      ["type", "mindmap"],
      ["position", { x: 0, y: 0 }],
      ["dragHandle", ".dragHandle"],
    ]);
    const dataMap = new Y.Map([["textId", "root"]]);
    dataMap.set("text", new Y.Text("root text"));
    yMap.set("data", dataMap);
    this.nodes.push([yMap]);
  }

  onNodesChange = (changes: NodeChange[]) => {
    applyChangesWithSyncedStore(changes, this.nodes!, this.doc!);
  };
  onEdgesChange = (changes: EdgeChange[]) => {
    applyChangesWithSyncedStore(changes, this.edges!, this.doc!);
  };
  addChildNode = (parentNode: Node, position: XYPosition) => {
    const nodeId = nanoid();
    console.log("nodeId", nodeId);

    const newNodeMap = new Y.Map<unknown>([
      ["id", nodeId],
      ["type", "mindmap"],
      ["position", position],
      ["dragHandle", ".dragHandle"],
      ["parentNode", parentNode.id],
    ]);
    const dataMap = new Y.Map([["textId", nodeId]]);
    dataMap.set("text", new Y.Text("sub"));
    newNodeMap.set("data", dataMap);

    const newEdgeMap = new Y.Map<unknown>([
      ["id", nanoid()],
      ["source", parentNode.id],
      ["target", nodeId],
    ]);

    const _this = this;
    this.doc.transact(() => {
      _this.nodes.push([newNodeMap]);
      _this.edges.push([newEdgeMap]);
    });
  };

  updateNodeLabel = (nodeId: string, label: string) => {
    let deletedIndex = -1;
    let updateItem: any;
    this.nodes.forEach((node, index) => {
      if (node.get("id") === nodeId) {
        // updateItem = {
        //   ...node.toJSON(),
        //   data: { ...(node.get("data") as Object), label },
        // };
        // deletedIndex = index;
        node.set("data", node.get("data"));
      }
    });

    // if (deletedIndex >= 0) {
    //   this.doc.transact(() => {
    //     this.nodes.delete(deletedIndex, 1);
    //     const updated = Object.keys(updateItem).map((key) => [
    //       key,
    //       updateItem[key],
    //     ]);
    //     this.nodes.push(new Y.Map(updated));
    //   });
    // }
  };
}

export const yStore = new ReactFlowYStore();

export function useYArray<T>(
  yArray: Y.Array<Y.Map<unknown>>,
  initialValue?: T[]
): T[] {
  const [arr, setArr] = useState(initialValue || yArray.toJSON());
  useEffect(() => {
    const f = (events: Y.YEvent<any>[]) => {
      // events.forEach((event) => {
      //   if (event instanceof Y.YArrayEvent) {
      //     let retain = 0;
      //     event.changes.delta.forEach((change) => {
      //       if (change.retain) {
      //         retain += change.retain;
      //       }
      //       if (change.delete) {
      //         arr.splice(retain, change.delete);
      //       }
      //       if (change.insert) {
      //         if (Array.isArray(change.insert)) {
      //           const value = change.insert.map((r) => r.toJSON());
      //           arr.splice(retain, 0, ...value);
      //         } else {
      //           arr.splice(retain, 0, change.insert as T);
      //         }
      //         retain += change.insert.length;
      //       }
      //     });
      //   }
      //   if (event instanceof Y.YMapEvent) {
      //     let deletedIndex = 0;
      //     arr.forEach((item, index) => {
      //       if ((item as any).id === event.target.get("id")) {
      //         deletedIndex = index;
      //       }
      //     });

      //     arr.splice(deletedIndex, 1);
      //     arr.push(event.target.toJSON() as any);
      //   }
      //   if (event instanceof Y.YTextEvent) {
      //     arr.forEach((item, index) => {
      //       if (
      //         (item as any).id ===
      //         (event.target.parent as Y.Map<any>)?.get("textId")
      //       ) {
      //         item.data = { text: event.target.toJSON(), textId: item.id };
      //       }
      //     });
      //   }
      // });

      // setArr([...arr]);
      const arr = yArray.map((item) => {
        const itemJson = item.toJSON();
        if (item.get("data") as any) {
          itemJson.data.yText = (item.get("data") as any).get("text");
        }
        return itemJson;
      });

      setArr([...arr]);
    };

    yArray.observeDeep(f);

    return () => yArray.unobserveDeep(f);
  }, []);

  return arr;
}
export const yUndoManager = new Y.UndoManager([yStore.edges, yStore.nodes]);

export const wsProvider = new WebsocketProvider(
  "wss://demos.yjs.dev/",
  "klolll",
  yStore.doc
);
const idbProvider = new IndexeddbPersistence("klolll", yStore.doc);


export const disconnect = () => wsProvider.disconnect();
export const connect = () => wsProvider.connect();

// idbProvider.once('sync')
// wsProvider.on('')