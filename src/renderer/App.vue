<template>
  <div id="app">
    <Header></Header>
    <div id="bodyer">
      <router-view/>
    </div>
  </div>
</template>

<script>
import Header from '@/components/Header/Header'


export default {
  name: 'App',
  components:{Header}
}
</script>

<style lang='scss'>
@import './assets/css/reset.scss';
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 100%;
  /* margin-top: 60px; */
}
// background-color: #ececec;
#bodyer{width: 100%;;margin: 0 auto;}

</style>
