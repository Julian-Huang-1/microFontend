import { setup, assign, fromPromise, enqueueActions, raise } from "xstate";
import { v4 as uuidv4 } from "uuid";

// 防抖延迟时间(毫秒)
const DEBOUNCE_DELAY = 800;

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  synced: boolean; // 标识是否与后端同步
  pendingSync: boolean; // 标识是否等待同步
}
interface PendingSyncItem {
  id: string;
  action: TodoListEventType;
}

interface TodoListContext {
  todos: Todo[];
  pendingSyncItems: PendingSyncItem[]; // 等待同步的todo id列表
  syncInProgress: boolean; // 是否有同步正在进行
  lastSyncTime: number; // 上次同步时间
}

type TodoListEvent =
  | { type: "ADD_TODO"; text: string }
  | { type: "DELETE_TODO"; id: string }
  | { type: "TOGGLE_TODO"; id: string }
  | { type: "CLEAR_COMPLETED" }
  | { type: "REORDER_TODOS"; todos: Todo[] }
  | { type: "QUEUE_SYNC"; id: string; action: TodoListEventType }
  | { type: "START_SYNC" }
  | { type: "SYNC_SUCCESS"; id: string; action: TodoListEventType }
  | {
      type: "SYNC_FAILURE";
      id: string;
      action: TodoListEventType;
      error?: string;
    }
  | { type: "SYNC_CANCEL" };

type TodoListEventType = TodoListEvent["type"];
// 模拟与后端同步的函数
const syncTodoWithBackend = (id: string, action: TodoListEventType) => {
  return new Promise<{ success: boolean }>((resolve) => {
    // 模拟网络延迟和可能的失败
    setTimeout(() => {
      const success = Math.random() > 0.5; // 80%成功率
      //   const success = action === "DELETE_TODO" ? true : false;
      resolve({ success });
    }, 1000);
  });
};

export const createTodoListMachine = () => {
  return setup({
    types: {
      context: {} as TodoListContext,
      events: {} as TodoListEvent,
    },
    actions: {
      addTodoToList: assign({
        todos: ({ context, event }) => {
          if (event.type !== "ADD_TODO") return context.todos;

          const newTodo = {
            id: uuidv4(),
            text: event.text,
            completed: false,
            synced: false,
            pendingSync: true, // 标记为待同步
          };

          return [...context.todos, newTodo];
        },
      }),

      // 将todo ID添加到同步队列
      addSyncItem: assign({
        todos: ({ context, event }) => {
          if (event.type !== "QUEUE_SYNC") return context.todos;

          return context.todos.map((todo) =>
            todo.id === event.id ? { ...todo, pendingSync: true } : todo
          );
        },
        pendingSyncItems: ({ context, event }) => {
          if (event.type !== "QUEUE_SYNC") return context.pendingSyncItems;

          return [
            ...context.pendingSyncItems,
            { id: event.id, action: event.action },
          ];
        },
      }),

      // 开始同步
      startSync: assign({
        syncInProgress: () => true,
        lastSyncTime: () => Date.now(),
      }),

      // 同步成功后更新todo状态
      markTodoAsSynced: assign({
        todos: ({ context, event }) => {
          if (event.type !== "SYNC_SUCCESS") return context.todos;

          return context.todos.map((todo: Todo) =>
            todo.id === event.id //这里的todo === todo.id !!
              ? { ...todo, synced: true, pendingSync: false }
              : todo
          );
        },
        // 从等待同步队列中移除已同步的ID
        pendingSyncItems: ({ context, event }) => {
          if (event.type !== "SYNC_SUCCESS") return context.pendingSyncItems;

          return context.pendingSyncItems.filter(
            (item) => item.id !== event.id
          );
        },
        syncInProgress: () => false,
      }),

      // 同步失败
      markSyncFailed: assign({
        // todos: ({ context, event }) => {
        //   if (event.type !== "SYNC_FAILURE") return context.todos;

        //   return context.todos.map((todo: Todo) =>
        //     todo.id === event.todo.id
        //       ? { ...todo } // 继续在等待同步中
        //       : todo
        //   );
        // },
        // 不删除失败的item
        // pendingSyncItems: ({ context, event }) => {
        //   if (event.type !== "SYNC_FAILURE") return context.pendingSyncItems;

        //   return [
        //     ...context.pendingSyncItems.filter(
        //       (item) => item.id !== event.todo.id
        //     ),
        //     { id: event.todo.id, action: event.action },
        //   ];
        // },
        syncInProgress: () => false,
      }),

      //同步取消
      markSyncCancel: assign({
        syncInProgress: () => false,
      }),

      // 其它操作动作
      removeTodo: assign({
        todos: ({ context, event }) => {
          if (event.type !== "DELETE_TODO") return context.todos;

          return context.todos.filter((todo: Todo) => todo.id !== event.id);
        },
      }),

      toggleTodo: assign({
        todos: ({ context, event }) => {
          if (event.type !== "TOGGLE_TODO") return context.todos;

          return context.todos.map((todo: Todo) =>
            todo.id === event.id
              ? {
                  ...todo,
                  completed: !todo.completed,
                  synced: false,
                  pendingSync: true, // 标记为待同步
                }
              : todo
          );
        },
      }),

      clearCompleted: assign({
        todos: ({ context }) =>
          context.todos.filter((todo: Todo) => !todo.completed),
        // 从待同步队列中移除已完成的todo
        pendingSyncItems: ({ context }) => {
          const completedIds = context.todos
            .filter((todo) => todo.completed)
            .map((todo) => todo.id);

          return context.pendingSyncItems.filter(
            (item) => !completedIds.includes(item.id)
          );
        },
      }),

      reorderTodos: assign({
        todos: ({ context, event }) => {
          if (event.type !== "REORDER_TODOS") return context.todos;

          // 保持同步状态
          const newOrder = event.todos;
          return newOrder.map((newTodo: Todo) => {
            const existingTodo = context.todos.find(
              (t: Todo) => t.id === newTodo.id
            );
            return existingTodo
              ? {
                  ...newTodo,
                  synced: existingTodo.synced,
                  pendingSync: existingTodo.pendingSync,
                }
              : {
                  ...newTodo,
                  synced: false,
                  pendingSync: true,
                };
          });
        },
      }),

      // 状态变更后触发同步队列
      triggerQueueSync: enqueueActions(({ context, event, self }) => {
        // 根据事件类型确定要同步的todo ID
        let todoId: string | undefined;
        let action: TodoListEventType | undefined;

        if (event.type === "ADD_TODO") {
          // 对于添加操作，队列中添加最后一个todo
          const lastTodo = context.todos[context.todos.length - 1];
          todoId = lastTodo?.id;
          action = "ADD_TODO";
        } else if (event.type === "TOGGLE_TODO") {
          // 对于切换操作，队列中添加被切换的todo
          todoId = event.id;
          action = "TOGGLE_TODO";
        } else if (event.type === "DELETE_TODO") {
          // 对于删除操作，队列中添加被删除的todo
          todoId = event.id;
          action = "DELETE_TODO";
        } else if (event.type === "CLEAR_COMPLETED") {
          // 对于清除已完成操作，队列中添加所有标记为删除的todo
        }

        // 如果找到了需要同步的todo，将其加入同步队列
        if (todoId && action) {
          self.send({ type: "QUEUE_SYNC", id: todoId, action });
        }
      }),
    },
    guards: {
      // 检查是否可以开始同步(防抖判断)
      canStartSync: ({ context }) => {
        // 如果没有等待同步的项，不需要同步
        if (context.pendingSyncItems.length === 0) return false;

        // 如果已经有同步在进行中，不开始新的同步
        if (context.syncInProgress) return false;
        // debugger;
        // 检查上次同步时间，实现防抖
        // const now = Date.now();
        // return now - context.lastSyncTime >= DEBOUNCE_DELAY;
        return true;
      },

      // 检查是否还有待同步的项
      hasPendingSyncItems: ({ context }) => {
        return context.pendingSyncItems.length > 0;
      },
    },
    actors: {
      syncTodo: fromPromise(async ({ input }) => {
        const { id, action } = input as {
          id: string;
          action: TodoListEventType;
        };
        if (!id) return {};

        let res;
        try {
          res = await syncTodoWithBackend(id, action);
          return { id, res, success: res.success, action };
        } catch (error) {
          console.error(`Error syncing todo ${id}:`, error);
          return { id, res: error, success: false, action };
        }
      }),
    },
  }).createMachine({
    id: "todoList",
    type: "parallel", // 使用并行状态实现同步与操作的独立性
    context: {
      todos: [],
      pendingSyncItems: [],
      syncInProgress: false,
      lastSyncTime: 0,
    },
    states: {
      // 任务操作子状态
      operations: {
        initial: "ready",
        states: {
          ready: {
            on: {
              ADD_TODO: {
                actions: ["addTodoToList", "triggerQueueSync"],
              },
              DELETE_TODO: {
                actions: ["removeTodo", "triggerQueueSync"],
              },
              TOGGLE_TODO: {
                actions: ["toggleTodo", "triggerQueueSync"],
              },
              CLEAR_COMPLETED: {
                actions: ["clearCompleted", "triggerQueueSync"],
              },
              REORDER_TODOS: {
                actions: "reorderTodos",
              },
            },
          },
        },
      },
      // 同步处理子状态
      synchronization: {
        initial: "idle",
        states: {
          idle: {
            reenter: assign({
              syncInProgress: () => false,
            }),
            always: {
              // 当满足防抖条件且有待同步项时，切换到同步状态
              guard: "canStartSync",
              target: "syncing",
              actions: "startSync",
            },
          },
          syncing: {
            invoke: {
              src: "syncTodo",
              input: ({ context }) => {
                const todoId = context.pendingSyncItems[0].id;
                const action = context.pendingSyncItems[0].action;
                return {
                  id: todoId,
                  action,
                };
              },
              onDone: {
                actions: [
                  ({ event, self }) => {
                    const { success, id, action } = event.output as {
                      success: boolean;
                      id: string;
                      action: TodoListEventType;
                    };

                    // 如果todo不存在，则取消同步 (有可能用户此刻删除了todo)
                    if (!id) self.send({ type: "SYNC_CANCEL" });

                    if (success) {
                      self.send({ type: "SYNC_SUCCESS", id, action });
                    } else {
                      self.send({
                        type: "SYNC_FAILURE",
                        id,
                        error: "Failed to sync with backend",
                        action,
                      });
                    }
                  },
                ],
              },
            },
            on: {
              SYNC_SUCCESS: {
                actions: "markTodoAsSynced",
                target: "idle",
              },
              SYNC_FAILURE: {
                actions: "markSyncFailed",
                target: "idle",
              },
              SYNC_CANCEL: {
                actions: "markSyncCancel",
                target: "idle",
              },
            },
          },
        },
      },
    },
    on: {
      QUEUE_SYNC: {
        actions: "addSyncItem",
      },
    },
  });
};
