const { app, dialog } = require('electron');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events').EventEmitter;//event manger
const _ = require('underscore');
const { spawn, spawnSync } = require('child_process');

const ClientBinaryManager = require('ethereum-client-binaries').Manager;//Geth下载
const download = require('download');
const Settings = require('./settings');


//TODO 主网没上线，先用Geth做模拟
const DEMO_BINARY_URL = 'https://raw.githubusercontent.com/ethereum/mist/master/clientBinaries.json';//DEMO URI
const ALLOWED_DOWNLOAD_URLS_REGEX = /^https:\/\/(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)?ethereum\.org\/|gethstore\.blob\.core\.windows\.net\/|bintray\.com\/artifact\/download\/karalabe\/ethereum\/)(?:.+)/; // eslint-disable-line max-len
axios.defaults.timeout = 6000

class Manager extends EventEmitter {
    constructor() {
        super();
        this._availableClients = {};
    }
    init(restart) {
        setInterval(() => this._checkForNewConfig(true), 1000 * 60 * 60);
        return this._checkForNewConfig(restart);
    }

    _checkForNewConfig(restart) {
        const nodeTypeDEMO = 'Geth';
        let nodeInfo;
        let binariesIsDownloaded = false;
        this._emit('loadConfig', `Get remote client config ${DEMO_BINARY_URL}`);

        //取Github上的配置
        return axios.get(DEMO_BINARY_URL)
            .then(res => {
                if (!res || _.isEmpty(res.data)) {
                    throw new Error('Invalid result');
                } else {
                    return res.data;
                }
            })
            .catch(err => {
                console.log('ERR:从远程仓库中获取客户端二进制文件配置时出错', err);//请求出错了,比如路径错了，超时了之类
            })

            //处理从Github上获取到了配置文件
            .then(latestConfig => {
                //latestConfig 是从客户端拿到的配置文件
                if (!latestConfig) return;

                let localConfig;//本地配置
                let skipedVersion;//跳过版本
                const nodeVersion = latestConfig.clients[nodeTypeDEMO].version;//Girhub上最新的Geth版本
                this._emit('loadConfig', '远程的版本号是：' + nodeVersion + ', 现在获取本地配置,拿来和Github上当前版本做对比');


                //读取本地二进制配置文件，如果没有，将从github上获取的最新配置文件写入本地磁盘
                try {
                    // 现在加载本地json
                    localConfig = JSON.parse(fs.readFileSync(path.join(Settings.userDataPath, 'clientBinaries.json')).toString());
                    console.log("本地磁盘文件版本是"+localConfig.clients.Geth.version,"文件在",Settings.userDataPath+'/clientBinaries.json')

                } catch (err) {
                    console.log(`加载本地配置时出错- 假设这是第一次运行: ${err}`);
                    if (latestConfig) {
                        localConfig = latestConfig;
                        this._writeLocalConfig(localConfig);
                    } else {
                        throw new Error('无法加载本地或远程配置，无法继续!');
                    }
                }


                //读取本地曾经忽略更新的节点版本信息，如果没有找到就算了；
                try {
                    skipedVersion = fs.readFileSync(
                            path.join(Settings.userDataPath, 'skippedNodeVersion.json')
                        ).toString();
                    console.log("本地忽略更新文件",Settings.userDataPath+'/skippedNodeVersion.json')

                } catch (err) {
                    console.log('没找到忽略更新文件 "skippedNodeVersion.json" 文件.');
                }


                // 准备节点信息
                const platform = process.platform
                    .replace('darwin', 'mac')
                    .replace('win32', 'win')
                    .replace('freebsd', 'linux')
                    .replace('sunos', 'linux');
                
                    console.log("process.platform",process.platform)
                    console.log("处理后的platform",platform+"  "+process.arch)
                    

                const binaryVersion = latestConfig.clients[nodeTypeDEMO].platforms[platform][process.arch];
                const checksums = _.pick(binaryVersion.download, 'sha256', 'md5');//返回一个object副本，只过滤出keys参数指定的属性值
                const algorithm = _.keys(checksums)[0].toUpperCase();//检索object拥有的所有可枚举属性的名称
                const hash = _.values(checksums)[0];//返回object对象所有的属性值

                // 获取节点数据，以便能够将它传递给可能的错误
                nodeInfo = {
                    type: nodeTypeDEMO,//Geth
                    version: nodeVersion,
                    checksum: hash,
                    algorithm
                };

                // 如果新的配置版本可用，然后询问用户是否希望更新
                console.log("是否需要更新",latestConfig && JSON.stringify(localConfig) !== JSON.stringify(latestConfig) && nodeVersion !== skipedVersion)
                if (latestConfig && ( JSON.stringify(localConfig) !== JSON.stringify(latestConfig) ) && ( nodeVersion !== skipedVersion ) ) {
                    // localConfig.clients.Geth.version  != latestConfig.clients.Geth.version
                    
                    // console.log('找到新客户端二进制文件配置, 询问用户是否希望更新...');
                    console.log("找到新客户端二进制文件配置,是否需要更新")
                    // return new Q(resolve => {
                    //     console.log('找到新客户端二进制文件配置, 询问用户是否希望更新...');
                    // });
                }

                return localConfig;
            })

            //准备下载了
            .then(localConfig => {
                //配置 localConfig 
                if (!localConfig) {
                    console.log('无法加载ClientBinaryManager的配置, 使用本地 clientBinaries.json');
                    const localConfigPath = path.join(Settings.userDataPath, 'clientBinaries.json');

                    localConfig = fs.existsSync(localConfigPath) ? require(localConfigPath) : require('../clientBinaries.json');
                    // eslint-disable-line no-param-reassign, global-require, import/no-dynamic-require, import/no-unresolved
                }

                // 扫描节点
                console.log("localConfig的文件是", localConfig.clients.Geth.version)

                //
                var url = {
                    // "linux":"https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.8.2-b8b9f7f4.tar.gz",
                    // "macos":"https://gethstore.blob.core.windows.net/builds/geth-darwin-amd64-1.8.2-b8b9f7f4.tar.gz",
                    // "windows":"https://gethstore.blob.core.windows.net/builds/geth-windows-amd64-1.8.2-b8b9f7f4.zip",

                    "linux":"http://a.f265.com/test/geth/geth-linux-amd64-1.8.2-b8b9f7f4.tar.gz",
                    "macos":"http://a.f265.com/test/geth/geth-darwin-amd64-1.8.2-b8b9f7f4.tar.gz",
                    "windows":"http://a.f265.com/test/geth/geth-windows-amd64-1.8.2-b8b9f7f4.zip",
                }

                var options = {
                    directory: "/Users/broszhu/Library/Application Support/Electron/geth_demo",
                    filename: "filename",
                    extract:true,
                    timeout:1000*60
                }

                //TODO 判断是否有Geth
                try {
                    var stats = fs.statSync(options.directory+'/geth-darwin-amd64-1.8.2-b8b9f7f4/geth2');
                    console.log("存在的")
                } catch (err) {
                    console.log("不存在的")
                }
                
                console.log("判断是否有Geth")

                download(url.macos, options.directory,options).then(() => {
                    console.log('已经下载好了!');
                });

                return;
                // const mgr = new ClientBinaryManager(localConfig);
                
                // this._emit('scanning', '扫描二进制文件');

                //初始化（扫描系统上现有的二进制文件）
                // return mgr.init({
                //     folders: [
                //         path.join(Settings.userDataPath, 'binaries', 'Geth', 'unpacked'),
                //         path.join(Settings.userDataPath, 'binaries', 'Eth', 'unpacked')
                //     ]
                // })

                //     //
                //     .then(() => {
                //         const clients = mgr.clients;
                //         this._availableClients = {};


                //         const available = _.filter(clients, c => !!c.state.available);//遍历list中的每个值，返回所有通过真值检测的元素所组成的数组
                //         console.log("clients是什么呢", clients)
                //         console.log("available是什么呢", available)

                //         this._emit('filtering', '过滤可用的客户端');
                //         _.each(mgr.clients, client => {
                //             if (client.state.available) {
                //                 const idlcase = client.id.toLowerCase();

                //                 //idlcase
                //                 ///Users/broszhu/Library/Application Support/Electron/binaries/Geth/unpacked/geth
                //                 console.log("binPath",idlcase,Settings[`${idlcase}Path`] , client.activeCli.fullPath);
                            

                //                 this._availableClients[idlcase] = {
                //                     binPath:client.activeCli.fullPath,
                //                     // binPath:Settings[`${idlcase}Path`] || client.activeCli.fullPath,
                //                     version: client.version
                //                 };
                //             }
                //         });


                //         if (!available.length) {
                //             if (_.isEmpty(clients)) {
                //                 throw new Error('没有可用于该系统的客户端二进制文件!');
                //             }
                //             console.log("_.values(clients)",_.values(clients))
                //             this._emit('downloading', '下载二进制文件' + Settings.userDataPath);

                //             axios.all(_.values(clients).map(function(c) {
                //                 binariesIsDownloaded = true;//二进制文件是否已下载
                //                   console.log("正在下载",c.id)
                //                 return mgr.download(c.id, {
                //                     downloadFolder: path.join(Settings.userDataPath, 'binaries'),//其中存档下载到文件夹
                //                     urlRegex: ALLOWED_DOWNLOAD_URLS_REGEX//只从这里下载
                //                 }).then(file => {
                //                     console.log("文件下载好啦！！！")
                //                     this.runGeth()
                //                 });
                //             }))
                //         }else{
                //             console.log("已经有Geth了")
                //             this.runGeth()
                //         }

                //     })

                //     //
                //     .then(() => {
                //         //如果下载
                //         if(binariesIsDownloaded){
                //             dialog.showMessageBox(
                //                 {
                //                   type: 'warning',
                //                   buttons: ['OK'],
                //                   message: '正在下载Geth文件，请等待',
                //                   detail: '详情'
                //                 },
                //                 () => {}
                //               );
                //         }
                //         // 如果在运行时下载，则重启
                //         if (restart && binariesIsDownloaded) {
                //             console.log('重新启动应用程序 ...');
                //             app.relaunch();
                //             app.quit();
                //         }
                //         this._emit('done');
                //     });


            })
            .catch(err => {
                // log.error(err);
                console.log(err);
                this._emit('error', err.message);
            });
    }

    //Github上获取的最新配置文件写入本地磁盘
    _writeLocalConfig(json) {
        // log.info('将新客户端二进制文件本地配置写入磁盘...');
        console.log("将Github上获取的客户端二进制配置文件，写入磁盘的本地配置",Settings.userDataPath)
        fs.writeFileSync(
            path.join(Settings.userDataPath, 'clientBinaries.json'),
            JSON.stringify(json, null, 2)
        );
    }


    _emit(status, msg) {
        // log.debug(`Status: ${status} - ${msg}`);
        console.log(`Status: ${status} - ${msg}`);
        this.emit('status', status, msg);
    }

    runGeth(){
        console.log("启动Geth",this._availableClients['geth'].binPath)
        let instance = spawn(this._availableClients['geth'].binPath,[
            '--rpc', 
            '--rpccorsdomain="http://localhost:8545"']);
    }
}

module.exports = new Manager();
