import React from "react";
window.a = "react";
function App() {
  return (
    <div className="react-app">
      <h1>React 子应用</h1>
      <p>这是一个 React 应用</p>
      全局变量:{window.a}
    </div>
  );
}

export default App;
