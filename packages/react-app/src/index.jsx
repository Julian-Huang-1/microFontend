import React from "react";
import ReactDOM from "react-dom";
import App from "./App.jsx";

let root = null;

function mount(container) {
  root = container;
  ReactDOM.createRoot(container).render(<App />);
}

function unmount() {
  if (root) {
    root.innerHtml = "";
  }
}

// 导出给主应用使用
window.reactApp = { mount, unmount };
