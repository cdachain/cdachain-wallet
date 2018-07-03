import Vue from 'vue'
import App from './App'
import router from './router'
import ElementUI from 'element-ui';
// import 'element-ui/lib/theme-chalk/index.css';
import './assets/css/element-ui.css';

import Czr from './czr'

//Introducing db database
import db from '../datastore/index'

//Introducing languages that need support
import VueI18n from 'vue-i18n'
import languges from '../../i18n/languges_conf'

//log4js
//testLog4.js
const path = require("path");
const log4js = require('log4js')
import utility from '../setting/settings'

const logPath = path.join(utility.userDataPath, 'logs', "error.log")
log4js.configure({
    appenders: { cheese: { type: 'file', filename: logPath } },
    categories: { default: { appenders: ['cheese'], level: 'info' } }
});
Vue.log4js = Vue.prototype.$log4js = log4js
const logger = log4js.getLogger('=>>');
logger.info(" ********** RUN MAIN ********** ");

Vue.use(VueI18n);
Vue.use(ElementUI);
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

let czr = new Czr();
Vue.czr = Vue.prototype.$czr = czr;


Vue.prototype.$db = db
Vue.prototype.$logger = logger


// Loading i18 language
const messages = {};
for (const languge in languges) {
    messages[languge] = require("@/i18n/" + languge + ".json");
}
//Determine the user's language
let locale = db.get('czr_setting.lang').value();
const i18n = new VueI18n({
    locale: locale,// set locale
    messages,       // set locale messages 
});



/* eslint-disable no-new */
Vue.config.productionTip = false
new Vue({
    el: '#app',
    router,
    i18n,
    render: h => h(App)
})