import { createApp } from 'vue';
import App from './App.vue';

let app = null;

export function mount(container) {
  app = createApp(App);
  app.mount(container);
  return app;
}

export function unmount() {
  if (app) {
    app.unmount();
    app = null;
  }
}

// 导出给主应用使用
window.vueApp = { mount, unmount };
