import React, { useState } from "react";
import { useTodoList } from "../../logics/todoList/useTodoList";
import type { Todo } from "../../logics/todoList/todoListMachine";

export default function TodoList() {
  const { todos, onAddTodo, onDeleteTodo, onToggleTodo } = useTodoList();
  const [newTodo, setNewTodo] = useState("");
  return (
    <div className="todolist-containet">
      <input
        type="text"
        value={newTodo}
        onChange={(e) => setNewTodo(e.target.value)}
      />
      <button onClick={() => onAddTodo(newTodo)}>Add</button>
      <div className="todolist-list">
        {todos.map((todo: Todo) => (
          <div key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => onToggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => onDeleteTodo(todo.id)}>删除</button>
            {todo.pendingSync && <span>正在同步中</span>}
            {todo.synced && <span>同步成功</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
