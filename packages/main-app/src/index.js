window.a = "main ";

class Sandbox {
  constructor() {
    this.proxy = null;
    this.sandboxWindow = {};
    this.init();
  }

  init() {
    this.proxy = new Proxy(window, {
      set: (target, key, value) => {
        console.log("set", key, value);
        this.sandboxWindow[key] = value;
        return true;
      },
      get: (target, key) => {
        console.log("get", key);
        if (key in this.sandboxWindow) {
          return this.sandboxWindow[key];
        }
        return window[key];
      },
    });
  }

  getProxy() {
    return this.proxy;
  }

  clear() {
    this.sandboxWindow = {};
  }
}

class MicroFrontend {
  constructor() {
    this.apps = [];
    this.currentApp = null;
    this.sandbox = new Sandbox();

    window.addEventListener("popstate", () => this.routeChanged());
    window.addEventListener("load", () => this.routeChanged());
  }

  registerApp(name, routePrefix, loadFn, mountFn, unmountFn) {
    this.apps.push({
      name,
      routePrefix,
      loadFn,
      mountFn,
      unmountFn,
    });
  }

  routeChanged() {
    const path = window.location.pathname;

    const matchedApp = this.apps.find((app) =>
      path.startsWith(app.routePrefix)
    );

    if (
      this.currentApp &&
      (!matchedApp || this.currentApp.name !== matchedApp.name)
    ) {
      this.currentApp.unmountFn();
      this.currentApp = null;
      this.sandbox.clear();
    }

    if (
      matchedApp &&
      (!this.currentApp || this.currentApp.name !== matchedApp.name)
    ) {
      matchedApp.loadFn().then(() => {
        matchedApp.mountFn();
        this.currentApp = matchedApp;
      });
    }
  }
}

const microFrontend = new MicroFrontend();

// 修改当前的加载方式
microFrontend.registerApp(
  "vue-app",
  "/vue",
  () => {
    const vueAppUrl = process.env.VUE_APP_URL;
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = vueAppUrl;
      script.onload = () => {
        // 将子应用挂载到沙箱中
        const sandboxProxy = microFrontend.sandbox.getProxy();
        sandboxProxy.vueApp = window.vueApp;
        delete window.vueApp;
        resolve();
      };
      document.head.appendChild(script);
    });
  },
  () => {
    const sandboxProxy = microFrontend.sandbox.getProxy();
    sandboxProxy.vueApp.mount("#app-container");
  },
  () => {
    const sandboxProxy = microFrontend.sandbox.getProxy();
    sandboxProxy.vueApp.unmount();
  }
);

// 类似地修改React应用加载
microFrontend.registerApp(
  "react-app",
  "/react",
  () => {
    const reactAppUrl = process.env.REACT_APP_URL;
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = reactAppUrl;
      script.onload = () => {
        // 将子应用挂载到沙箱中
        const sandboxProxy = microFrontend.sandbox.getProxy();
        sandboxProxy.reactApp = window.reactApp;
        delete window.reactApp;
        resolve();
      };
      document.head.appendChild(script);
    });
  },
  () => {
    const sandboxProxy = microFrontend.sandbox.getProxy();
    sandboxProxy.reactApp.mount(document.getElementById("app-container"));
  },
  () => {
    const sandboxProxy = microFrontend.sandbox.getProxy();
    sandboxProxy.reactApp.unmount();
  }
);
