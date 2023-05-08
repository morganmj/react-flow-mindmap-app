import { NodeAddChange, NodeChange, NodeResetChange } from "reactflow";
import * as Y from "yjs";
import { NodeData } from "../MindMapNode";
import { yStore } from "../y";

/* eslint-disable @typescript-eslint/no-explicit-any */
function handleParentExpand(res: any[], updateItem: any) {
  const parent = res.find((e) => e.id === updateItem.parentNode);

  if (parent) {
    const extendWidth = updateItem.position.x + updateItem.width - parent.width;
    const extendHeight =
      updateItem.position.y + updateItem.height - parent.height;

    if (
      extendWidth > 0 ||
      extendHeight > 0 ||
      updateItem.position.x < 0 ||
      updateItem.position.y < 0
    ) {
      parent.style = { ...parent.style } || {};

      parent.style.width = parent.style.width ?? parent.width;
      parent.style.height = parent.style.height ?? parent.height;

      if (extendWidth > 0) {
        parent.style.width += extendWidth;
      }

      if (extendHeight > 0) {
        parent.style.height += extendHeight;
      }

      if (updateItem.position.x < 0) {
        const xDiff = Math.abs(updateItem.position.x);
        parent.position.x = parent.position.x - xDiff;
        parent.style.width += xDiff;
        updateItem.position.x = 0;
      }

      if (updateItem.position.y < 0) {
        const yDiff = Math.abs(updateItem.position.y);
        parent.position.y = parent.position.y - yDiff;
        parent.style.height += yDiff;
        updateItem.position.y = 0;
      }

      parent.width = parent.style.width;
      parent.height = parent.style.height;
    }
  }
}

export function applyChangesWithSyncedStore(
  changes: any[],
  elements: Y.Array<any>,
  doc: Y.Doc
): void {
  // console.log("changes", changes);
  // we need this hack to handle the setNodes and setEdges function of the useReactFlow hook for controlled flows
  if (changes.some((c) => c.type === "reset")) {
    const indexToDeletedList: number[] = [];
    elements.forEach((element, index) => {
      if (element.get("type") !== "reset") {
        indexToDeletedList.push(index);
      }
    });
    doc.transact(() => {
      if (indexToDeletedList.length) {
        indexToDeletedList
          .sort(function (a, b) {
            return a - b;
          })
          .forEach((indexToDeleted, index) => {
            elements.delete(indexToDeleted - index);
          });
      }
    });

    return;
  }

  //TODO
  const initElements = changes
    .filter((c) => c.type === "add")
    .map((c) => c.item);

  elements.push(
    initElements.map((updateItem) => {
      const yMap = new Y.Map(
        Object.keys(updateItem).map((key) => [key, updateItem[key]])
        // yMap.set('')
      );
    })
  );

  const indexToDeletedList: number[] = [];
  const itemToAddedList: any[] = [];

  elements.forEach((item, index) => {
    const itemObject = item.toJSON();
    const currentChanges = changes.filter((c) => c.id === itemObject.id);
    const updateItem = { ...itemObject };
    let updateItemDeleted = false;

    if (currentChanges.length) {
      for (const currentChange of currentChanges) {
        if (currentChange) {
          switch (currentChange.type) {
            case "select": {
              // updateItem.selected = currentChange.selected;
              item.set("selected", currentChange.selected);
              break;
            }
            case "position": {
              if (typeof currentChange.position !== "undefined") {
                // updateItem.position = currentChange.position;
                item.set("position", currentChange.position);
              }

              if (typeof currentChange.positionAbsolute !== "undefined") {
                // updateItem.positionAbsolute = currentChange.positionAbsolute;
                item.set("positionAbsolute", currentChange.positionAbsolute);
              }

              if (typeof currentChange.dragging !== "undefined") {
                // updateItem.dragging = currentChange.dragging;
                item.set("dragging", currentChange.dragging);
              }

              // TODO:处理
              // if (updateItem.expandParent) {
              //   handleParentExpand(elements, updateItem);
              // }
              break;
            }
            case "dimensions": {
              if (typeof currentChange.dimensions !== "undefined") {
                // updateItem.width = currentChange.dimensions.width;
                // updateItem.height = currentChange.dimensions.height;
                item.set("width", currentChange.dimensions.width);
                item.set("height", currentChange.dimensions.height);
              }

              if (typeof currentChange.updateStyle !== "undefined") {
                // updateItem.style = {
                //   ...(updateItem.style || {}),
                //   ...currentChange.dimensions,
                // };
                item.set("style", {
                  ...(updateItem.style || {}),
                  ...currentChange.dimensions,
                });
              }

              if (typeof currentChange.resizing === "boolean") {
                // updateItem.resizing = currentChange.resizing;
                item.set("resizing", currentChange.resizing);
              }

              // if (updateItem.expandParent) {
              //   handleParentExpand(elements, updateItem);
              // }
              break;
            }
            case "remove":
              updateItemDeleted = true;
          }
        }
      }
      if (updateItemDeleted) {
        indexToDeletedList.push(index);
      } else {
        // indexToDeletedList.push(index);
        // itemToAddedList.push(updateItem);
      }
    }
  });

  doc.transact(() => {
    if (indexToDeletedList.length) {
      indexToDeletedList
        .sort(function (a, b) {
          return a - b;
        })
        .forEach((indexToDeleted, index) => {
          elements.delete(indexToDeleted - index);
        });
    }
    // if (itemToAddedList.length) {
    //   elements.push(
    //     itemToAddedList.map(
    //       (updateItem) =>
    //         new Y.Map(
    //           Object.keys(updateItem).map((key) => [key, updateItem[key]])
    //         )
    //     )
    //   );
    // }
  });
}

export const createSelectionChange = (id: string, selected: boolean) => ({
  id,
  type: "select",
  selected,
});

export function getSelectionChanges(items: any[], selectedIds: string[]) {
  return items.reduce((res, item) => {
    const willBeSelected = selectedIds.includes(item.id);

    if (!item.selected && willBeSelected) {
      item.selected = true;
      res.push(createSelectionChange(item.id, true));
    } else if (item.selected && !willBeSelected) {
      item.selected = false;
      res.push(createSelectionChange(item.id, false));
    }

    return res;
  }, []);
}
