<template>
  <div class="vue-app">
    <h1>Vue 子应用</h1>
    <p>这是一个 Vue 3 应用</p>
    全局变量：{{ globalVar }}
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      globalVar: window.a,
    };
  },
  beforeCreate() {
    window.a = "vue";
  },
};
</script>

<style>
.vue-app {
  padding: 20px;
  border: 2px solid #42b983;
  border-radius: 4px;
}
</style>
