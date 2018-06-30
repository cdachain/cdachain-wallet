<template>
    <div class="page-config" :style="{backgroundImage:backgroundImage}">
        <div class="icon-config">
            <i class="el-icon-loading"></i>
            <p class="config-test">配置检测中…</p>
            <p class="message">{{conMsg}}</p>
        </div>
        <el-dialog title="版本更新提示" :visible.sync="versionDialogSwitch" width="60%" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false" :modal="false">
            <span>CanonChain Wallet 已经有新版本，当前版本已停用，请至官网下载最新版钱包。</span>
            <span slot="footer" class="dialog-footer">
                <!-- <el-button @click="dropOut">退出钱包 </el-button> -->
                <el-button type="primary" @click="downloadWallet">去官网下载最新版钱包</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
const fs = require("fs");
const path = require("path");
const { remote, app, shell } = require("electron");
const axios = require("axios");
const download = require("download");
const { spawn, spawnSync } = require("child_process");
// const banner=require("@/assets/img/banner.png")
var self = null;
export default {
  name: "Config",
  data() {
    return {
      versionDialogSwitch: false,
      latest_config: {},
      local_config: {},
      node_info: {},
      userDataPath: "",
      walletVer: "0.1.0",
      conMsg: "",
      backgroundImage: "url(" + require("@/assets/img/banner.png") + ")",
      binariesIsDownloaded: false
    };
  },
  created() {
    self = this;
    const APP = process.type === "renderer" ? remote.app : app;
    this.userDataPath = APP.getPath("userData");
    this.initConfig();
    this.validity();
  },
  computed: {},
  methods: {
    validity() {
      var self = this;
      var targeyUrl =
        "http://www.canonchain.com/resource/file/canonchain/latest/czrVersion.json";
      axios.get(targeyUrl).then(function(response) {
        var dataInfo = response.data;
        var remoteVer = dataInfo.version;
        //如果钱包版本和远程一致,就继续执行
        if (self.walletVer == remoteVer) {
          self.checkForNewConfig();
        } else {
          self.versionDialogSwitch = true;
        }
      });
    },
    dropOut() {},
    downloadWallet() {
      shell.openExternal("http://www.canonchain.com/zh-CN");
    },
    initConfig() {
      var radom = Math.random();
      this.latest_config = {
        content: "",
        BINARY_URL:
          "http://www.canonchain.com/resource/file/canonchain/latest/clientBinaries.json" +
          "?radom=" +
          radom
      };
      this.node_info = {
        NODE_TYPE: "CanonChain",
        binaryVersion: ""
      };
      this.conMsg = "配置文件初始化完成";
      self.$logger.info("配置文件初始化完成");
    },

    checkForNewConfig() {
      var self = this;
      this.conMsg = "检测是否有新的 CanonChain 文件";
      self.$logger.info("检测是否有新的 CanonChain 文件 ");

      axios
        .get(self.latest_config.BINARY_URL)
        .then(function(response) {
          self.latest_config.content = response.data;
          self.conMsg = "已获取到远程配置文件";
          self.$logger.info("已获取到远程配置文件", response.data);
          self.checkLocalConfig();
        })
        .catch(function(error) {
          self.conMsg = error; //TODO 取本地的，本地取不到，取安装包的配置
        });
    },
    checkLocalConfig() {
      var self = this;
      this.conMsg = "检测本地的配置文件";
      self.$logger.info("检测本地的配置文件");
      //读取本地二进制配置文件
      try {
        // 现在加载本地json
        self.local_config = JSON.parse(
          fs
            .readFileSync(path.join(self.userDataPath, "clientBinaries.json"))
            .toString()
        );
        this.conMsg = "本地配置文件存在";
        self.$logger.info("本地配置文件存在");
      } catch (err) {
        this.conMsg = "没有检测到本地配置文件，可能是第一次运行";
        self.$logger.info("没有检测到本地配置文件，可能是第一次运行");
        if (self.latest_config.content) {
          self.local_config = self.latest_config.content;
          self.writeLocalConfig(self.latest_config.content);
        } else {
          this.conMsg = "无法加载本地或远程配置 无法继续!"; //TODO 加载安装包的配置
          self.$logger.info("无法加载本地或远程配置 无法继续!");
        }
      }
      self.isUpdate();
    },
    writeLocalConfig(json) {
      this.conMsg = "将Github上获取的客户端二进制配置文件，写入磁盘的本地配";
      self.$logger.info(
        "将Github上获取的客户端二进制配置文件，写入磁盘的本地配"
      );

      fs.writeFileSync(
        path.join(this.userDataPath, "clientBinaries.json"),
        JSON.stringify(json, null, 2)
      );
    },
    isUpdate() {
      // 如果新的配置版本可用，然后询问用户是否希望更新
      var latestVer = this.latest_config.content.clients[
        this.node_info.NODE_TYPE
      ].version;
      var localVer = this.local_config.clients[this.node_info.NODE_TYPE]
        .version;
      this.conMsg = "检测是否需要更新";
      self.$logger.info("检测是否需要更新", latestVer, localVer);
      if (latestVer == localVer) {
        this.conMsg = "本地 CanonChain 配置是最新的";
        self.$logger.info("本地 CanonChain 配置是最新的");
        this.isDownload();
      } else {
        this.conMsg = "本地 CanonChain 配置是老版本";
        self.$logger.info("本地 CanonChain 配置是老版本");
        this.writeLocalConfig(this.latest_config.content);
        this.isDownload();
      }
    },
    isDownload() {
      var self = this;
      // 准备节点信息
      const platform = process.platform
        .replace("darwin", "mac")
        .replace("win32", "win")
        .replace("freebsd", "linux")
        .replace("sunos", "linux");

      this.node_info.binaryVersion = this.latest_config.content.clients[
        this.node_info.NODE_TYPE
      ].platforms[platform][process.arch].download;

      var options = {
        directory: path.join(this.userDataPath, "download"),
        dirname: "filename",
        extract: true,
        timeout: 1000 * 60
      };

      //TODO 判断是否有 CanonChain
      this.conMsg = "判断是否有 CanonChain 应用程序";
      self.$logger.info("判断是否有 CanonChain 应用程序");
      try {
        self.$logger.info(
          "本地的节点文件",
          path.join(options.directory, this.node_info.binaryVersion.bin)
        );
        var stats = fs.statSync(
          path.join(options.directory, this.node_info.binaryVersion.bin)
        );
        this.conMsg = "存在的";
        self.$logger.info("存在的");
        self.runCanonChain();
      } catch (err) {
        this.conMsg = "正在下载节点程序,请耐心等待";
        self.$logger.info(
          "正在下载节点程序,请耐心等待",
          this.node_info.binaryVersion.url,
          options.directory
        );

        download(
          this.node_info.binaryVersion.url,
          options.directory,
          options
        ).then(() => {
          this.conMsg = "节点程序已经下载好";
          self.$logger.info("节点程序已经下载好");
          self.runCanonChain();
        });
      }
    },
    runCanonChain() {
      self.$logger.info(
        "准备启动 CanonChain :",
        this.userDataPath,
        "download",
        this.node_info.binaryVersion.bin
      );
      this.conMsg = "启动 CanonChain";

      var nodePath = path.join(
        this.userDataPath,
        "download",
        this.node_info.binaryVersion.bin
      );
      var ls = spawn(nodePath, [
        "--daemon",
        "--rpc_enable",
        "--rpc_enable_control"
      ]);
      this.conMsg = "CanonChain 已经启动 ";
      // sessionStorage.setItem("CanonChainPid", ls.pid);
      //进程守护
      this.guardNode(ls, nodePath);
      this.$router.push({ path: "home" });
    },
    guardNode(ls, nodePath) {
      var self = this;
      // ls.on("exit", function() {
      //   ls = spawn(path.join(nodePath), [
      //     "--daemon",
      //     "--rpc_enable",
      //     "--rpc_enable_control"
      //   ]);
      //   sessionStorage.setItem("CanonChainPid", ls.pid);
      //   self.guardNode(ls, nodePath);
      // });
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.page-config {
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  color: #fff;
  /* background-image: radial-gradient(50% 50%, #57509E 29%, #353469 93%, #333366 100%); */
  /* background-color: #333366; */
  /* background: url("../img/banner.png") no-repeat center center; */
  background: no-repeat center center;

  color: #000;
  width: 100%;
  -webkit-user-select: none;
}
.icon-config {
  width: 100%;
  text-align: center;
  margin-top: 100px;
}
.icon-config .el-icon-loading {
  font-size: 64px;
  margin-bottom: 10px;
  color: #fff;
}
.config-test {
  color: #fff;
  font-size: 16px;
}
.icon-config .message {
  margin-top: 50px;
  color: #fff;
}
</style>
