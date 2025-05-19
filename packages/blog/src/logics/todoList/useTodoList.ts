import { useActor, useMachine } from "@xstate/react";
import { createTodoListMachine } from "./todoListMachine";
import { useMemo } from "react";
import { createActor } from "xstate";

export const useTodoList = () => {
  const todoListMachine = useMemo(() => createTodoListMachine(), []);

  const [snapshot, send] = useActor(todoListMachine, {
    ...(process.env.NODE_ENV === "development" && window.inspector
      ? { inspect: window.inspector.inspect }
      : {}),
  });

  console.log(snapshot.context);

  const onAddTodo = (text: string) => {
    send({ type: "ADD_TODO", text });
  };

  const onDeleteTodo = (id: string) => {
    send({ type: "DELETE_TODO", id });
  };

  const onToggleTodo = (id: string) => {
    send({ type: "TOGGLE_TODO", id });
  };

  return {
    todos: snapshot.context.todos,
    onAddTodo,
    onDeleteTodo,
    onToggleTodo,
  };
};
