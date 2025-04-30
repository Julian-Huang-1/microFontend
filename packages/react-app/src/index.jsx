import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.jsx';

let root = null;

function mount(container) {
  root = ReactDOM.createRoot(container);
  root.render(<App />);
}

function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
}

// 导出给主应用使用
window.reactApp = { mount, unmount };
