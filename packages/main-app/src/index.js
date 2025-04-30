class MicroFrontend {
  constructor() {
    this.apps = [];
    this.currentApp = null;

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
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  },
  () => window.vueApp.mount(document.getElementById("app-container")),
  () => window.vueApp.unmount()
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
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  },
  () => window.reactApp.mount(document.getElementById("app-container")),
  () => window.reactApp.unmount()
);
