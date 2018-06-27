<template>
    <div class="page-config">
        <div class="icon-config">
            <i class="el-icon-loading"></i>
            <p>配置检测中…</p>
            <p class="message">{{conMsg}}</p>
        </div>
    </div>
</template>

<script>
const fs = require("fs");
const path = require("path");
const { remote, app } = require("electron");
const axios = require("axios");
const download = require("download");
const { spawn, spawnSync } = require("child_process");

export default {
    name: "Config",
    data() {
        return {
            latest_config: {},
            local_config: {},
            node_info: {},
            userDataPath: "",
            conMsg: "",
            binariesIsDownloaded: false
        };
    },
    created() {
        const APP = process.type === "renderer" ? remote.app : app;
        this.userDataPath = APP.getPath("userData");
        this.initConfig();
        this.checkForNewConfig();
    },
    computed: {},
    methods: {
        initConfig() {
            this.latest_config = {
                content: "",
                BINARY_URL:
                    "http://www.canonchain.com/resource/file/canonchain/latest/clientBinaries.json"
                // BINARY_URL:"http://127.0.0.1:3000/assets/clientBinaries.json",
            };
            this.node_info = {
                NODE_TYPE: "CanonChain",
                binaryVersion: ""
            };
            this.conMsg = "配置文件初始化完成";
            console.log("配置文件初始化完成");
        },

        checkForNewConfig() {
            var self = this;
            this.conMsg = "检测是否有新的 CanonChain 文件";
            console.log("检测是否有新的 CanonChain 文件 ");

            axios
                .get(self.latest_config.BINARY_URL)
                .then(function(response) {
                    self.latest_config.content = response.data;
                    self.conMsg = "已获取到远程配置文件";
                    console.log("已获取到远程配置文件", response.data);
                    self.checkLocalConfig();
                })
                .catch(function(error) {
                    self.conMsg = error; //TODO 取本地的，本地取不到，取安装包的配置
                });
        },
        checkLocalConfig() {
            var self = this;
            this.conMsg = "检测本地的配置文件";
            console.log("检测本地的配置文件");
            //读取本地二进制配置文件
            try {
                // 现在加载本地json
                self.local_config = JSON.parse(
                    fs
                        .readFileSync(
                            path.join(self.userDataPath, "clientBinaries.json")
                        )
                        .toString()
                );
                this.conMsg = "本地配置文件存在";
                console.log("本地配置文件存在");
            } catch (err) {
                this.conMsg = "没有检测到本地配置文件，可能是第一次运行";
                console.log("没有检测到本地配置文件，可能是第一次运行");
                if (self.latest_config.content) {
                    self.local_config = self.latest_config.content;
                    self.writeLocalConfig(self.latest_config.content);
                } else {
                    this.conMsg = "无法加载本地或远程配置 无法继续!"; //TODO 加载安装包的配置
                    console.log("无法加载本地或远程配置 无法继续!");
                }
            }
            self.isUpdate();
        },
        writeLocalConfig(json) {
            this.conMsg =
                "将Github上获取的客户端二进制配置文件，写入磁盘的本地配";
                console.log("将Github上获取的客户端二进制配置文件，写入磁盘的本地配");

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
            console.log("检测是否需要更新");
            if (latestVer == localVer) {
                this.conMsg = "本地 CanonChain 是最新的";
                console.log("本地 CanonChain 是最新的");
                this.isDownload();
            } else {
                this.conMsg = "本地 CanonChain 是老版本";
                console.log("本地 CanonChain 是老版本");
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
            console.log("判断是否有 CanonChain 应用程序");
            try {
                var stats = fs.statSync(
                    path.join(
                        options.directory,
                        this.node_info.binaryVersion.bin
                    )
                );
                this.conMsg = "存在的";
                console.log("存在的");
                self.runCanonChain();
            } catch (err) {
                this.conMsg = "不存在的";
                console.log("不存在的",this.node_info.binaryVersion.url,
                    options.directory);

                download(
                    this.node_info.binaryVersion.url,
                    options.directory,
                    options
                ).then(() => {
                    this.conMsg = "已经下载好了";
                    console.log("已经下载好了");
                    self.runCanonChain();
                });
            }
        },
        runCanonChain() {
            console.log("启动 CanonChain ", this.node_info.binaryVersion.bin);
            this.conMsg = "启动 CanonChain";
            let instance = spawn(
                path.join(
                    this.userDataPath,
                    "download",
                    this.node_info.binaryVersion.bin
                ),
                ["--daemon"]
            );
            this.conMsg = "CanonChain 已经启动 ";
            this.$router.push({ path: "home" });
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
    background-color: #f2f2f2;
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
}
.icon-config .message {
    margin-top: 50px;
    color: rgb(34, 34, 34);
}
</style>
