<template>
    <div class="page-czr-home">
        <div class="home-banner">
            <i class="iconfont icon-logo">&#xe650;</i>
            <div>
                <el-button size="small" plain @click="initWalletCreateInfo">{{ $t('page_home2.create_wallet') }}</el-button>
                <el-button size="small" plain @click="dialogWalletSwitch.import = true">{{ $t('page_home2.import_wallet') }}</el-button>
            </div>
        </div>

        <div class="home-content">
            <div class="wallet-wrap">
                <template v-for="wallet in database">
                    <div class="wallet-item ">
                        <div class="b-flex b-flex-justify">
                            <div>
                                <h4 class="wallet-tag">{{wallet.tag}}</h4>
                                <p class="wallet-address">{{wallet.address}}</p>
                            </div>
                            <div>
                                <i class="iconfont wallet-action" @click.stop="showDownloadDia(wallet.address)">&#xe638;</i>
                                <i class="iconfont wallet-action" @click.stop="showEditWalletDia(wallet.address,wallet.tag)">&#xe604;</i>
                                <i class="iconfont wallet-action" @click.stop="showRemoveWalletDia(wallet.address)">&#xe613;</i>
                            </div>
                        </div>
                        <div class="account-wrap b-flex">
                            <template v-for="account in wallet.account_list">
                                <router-link :to="'/account/' + account.address" tag="div" class="accounrt-item ">
                                    <div class="account-avatar">
                                        <i class="iconfont ico-avatar">&#xe602;</i>
                                    </div>
                                    <i class="iconfont delete-acc" @click.stop="showRemoveAccountDia(wallet,account.address)">&#xe613;</i>
                                    <div class="account-cont">
                                        <p class="account-remark">{{account.tag}}</p>
                                        <h1 class="account-assets">{{account.balance | toEthVal}}</h1>
                                        <p class="account-unit">{{ $t('unit.czr') }}</p>
                                        <p class="account-address">{{account.address}}</p>
                                    </div>
                                </router-link>
                            </template>
                            <!--  ADD  -->
                            <div class="accounrt-item add-account" @click="showCreateAccDia(wallet.address)">
                                <div class="account-cont">
                                    <i class="iconfont icon-add-acc">&#xe63b;</i>
                                    <p class="add-acc-des">{{ $t('page_home2.add_account') }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </template>
            </div>

        </div>

        <!-- wallet create -->
        <el-dialog :title="createWalletInfo.step === 0 ? $t('page_home2.create_wallet_dia.create_tit') : $t('page_home2.create_wallet_dia.backup_tit') " :visible.sync="dialogWalletSwitch.create" width="60%">
            <template v-if="createWalletInfo.step === 0">
                <el-alert v-if="createWalletInfo.error" :title="createWalletInfo.error" :closable="false" type="error" show-icon>
                </el-alert>
                <el-input v-model="createWalletInfo.tag" :placeholder="$t('page_home2.create_wallet_dia.placeholder_tag')">
                    <template slot="prepend">
                        <i class="el-icon-tickets"></i> {{$t('page_home2.create_wallet_dia.create_tag')}}</template>
                </el-input>
                <el-input v-model="createWalletInfo.pwd" :placeholder="$t('page_home2.create_wallet_dia.placeholder_pwd')" type="password">
                    <template slot="prepend">
                        <i class="el-icon-edit"></i> {{$t('page_home2.create_wallet_dia.create_pwd')}}</template>
                </el-input>
                <el-input v-model="createWalletInfo.repwd" :placeholder="$t('page_home2.create_wallet_dia.placeholder_repwd')" type="password">
                    <template slot="prepend">
                        <i class="el-icon-edit"></i> {{$t('page_home2.create_wallet_dia.create_repwd')}}</template>
                </el-input>
                <div slot="footer">
                    <el-button @click="dialogWalletSwitch.create = false">{{ $t('cancel') }}</el-button>
                    <el-button type="primary" @click="createWallet">{{ $t('confirm') }}</el-button>
                </div>
            </template>
            <template v-else-if="createWalletInfo.step === 1">
                <el-alert :title="$t('page_home2.msg_info.create_success')" :description="$t('page_home2.msg_info.acc_wallet_success_des')" :closable="false" type="success" show-icon>
                </el-alert>
                <el-input :value="createWalletInfo.address">
                    <template slot="prepend">{{$t('page_home2.create_wallet_dia.wallet_address')}}</template>
                </el-input>
                <div slot="footer">
                    <el-button type="primary" @click="downloadKeystore(createWalletInfo.address)">{{$t('page_home2.create_wallet_dia.download_wallet_file')}}</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- wallet import -->
        <el-dialog :title="$t('page_home2.import_wallet_dia.tit')" :visible.sync="dialogWalletSwitch.import" @open="initWalletImportInfo" width="50%">
            <template>
                <el-alert v-if="importWalletInfo.alert" :title="importWalletInfo.alert.content" :closable="false" :type="importWalletInfo.alert.type" show-icon>
                </el-alert>
                <template>
                    <div v-if="!importWalletInfo.keystore" class="holder" @dragover.prevent.stop @drop.prevent.stop="importWalletKeystore"> {{$t('page_home2.import_wallet_dia.placeholder_keystore')}} </div>
                    <el-input v-model="importWalletInfo.tag" :placeholder="$t('page_home2.import_wallet_dia.placeholder_tag')">
                        <template slot="prepend">
                            <i class="el-icon-document"></i> {{$t('page_home2.import_wallet_dia.create_tag')}}</template>
                    </el-input>
                    <el-input v-model="importWalletInfo.pwd" :placeholder="$t('page_home2.import_wallet_dia.placeholder_pwd')" type="password">
                        <template slot="prepend">
                            <i class="el-icon-edit"></i> {{$t('page_home2.import_wallet_dia.input_pwd')}}</template>
                    </el-input>
                </template>
                <div slot="footer">
                    <el-button @click="dialogWalletSwitch.import = false">{{ $t('cancel') }}</el-button>
                    <el-button type="primary" @click="importAccount">{{ $t('confirm') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- wallet delete -->
        <el-dialog :title="$t('page_home2.remove_wallet_dia.tit')" :visible.sync="dialogWalletSwitch.remove" width="50%">
            <span>
                <p class="remove-wallet">
                    {{this.removeWallet}}
                </p>
                {{ $t('page_home2.remove_wallet_dia.backup') }}
            </span>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogWalletSwitch.remove = false">{{ $t('cancel') }}</el-button>
                <el-button type="danger" @click="removeWalletFn(removeWallet)">{{ $t('page_home2.remove_wallet_dia.remove_confrim') }}</el-button>
            </span>
        </el-dialog>

        <!-- download  -->
        <el-dialog :title="$t('page_home2.backup_wallet_dia.tit')" :visible.sync="dialogWalletSwitch.backUp" width="50%">
            <span>
                <p class="backup-wallet">
                    {{this.downloadWallet}}
                </p>
                {{ $t('page_home2.backup_wallet_dia.backup') }}
            </span>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogWalletSwitch.backUp = false">{{ $t('cancel') }}</el-button>
                <el-button type="warning" @click="downloadKeystore(downloadWallet)">{{ $t('page_home2.backup_wallet_dia.download') }}</el-button>
            </span>
        </el-dialog>

        <!-- edit tag -->
        <el-dialog :title="$t('page_account.edit_dia.tit')" :visible.sync="dialogWalletSwitch.editName" width="50%" center>
            <span>
                <p class="edit-name-subtit">{{$t('page_account.edit_dia.subtit')}}</p>
                <el-input v-model="editWallet.tag"></el-input>
            </span>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogWalletSwitch.editName = false">{{$t('cancel')}}</el-button>
                <el-button type="primary" @click="setWalletTag">{{$t('confirm')}}</el-button>
            </span>
        </el-dialog>

        <!-- create account  -->
        <el-dialog :title="createAccountInfo.step === 0 ? $t('page_home2.create_dia.create_tit') : $t('page_home2.create_dia.backup_tit') " :visible.sync="dialogAccountSwitch.create" @open="initCreateAccountInfo" width="60%">
            <template v-if="createAccountInfo.step === 0">
                <el-alert v-if="createAccountInfo.error" :title="createAccountInfo.error" :closable="false" type="error" show-icon>
                </el-alert>
                <el-input v-model="createAccountInfo.tag" :placeholder="$t('page_home2.create_dia.placeholder_tag')">
                    <template slot="prepend">
                        <i class="el-icon-tickets"></i> {{$t('page_home2.create_dia.create_tag')}}</template>
                </el-input>
                <div slot="footer">
                    <el-button @click="dialogAccountSwitch.create = false">{{ $t('cancel') }}</el-button>
                    <el-button type="primary" @click="createAccount">{{ $t('confirm') }}</el-button>
                </div>
            </template>
            <template v-else-if="createAccountInfo.step === 1">
                <el-alert :title="$t('page_home2.msg_info.create_success')" :description="$t('page_home2.msg_info.acc_create_success_des')" :closable="false" type="success" show-icon>
                </el-alert>
                <el-input :value="createAccountInfo.address" type="textarea" :autosize="{ minRows: 2, maxRows: 4}">
                    <template slot="prepend">{{$t('page_home2.create_dia.account_address')}}</template>
                </el-input>
                <div slot="footer">
                    <el-button type="primary" @click="dialogAccountSwitch.create= false">{{ $t('confirm') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- remove account -->
        <el-dialog :title="$t('page_home2.remove_wallet_dia.tit')" :visible.sync="dialogAccountSwitch.remove" width="50%">
            <span>
                <p class="remove-wallet">
                    {{this.removeAccountObj.account}}
                </p>
                {{ $t('page_home2.remove_wallet_dia.backup') }}
            </span>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogAccountSwitch.remove = false">{{ $t('cancel') }}</el-button>
                <el-button type="danger" @click="removeAccountFn(removeAccountObj.wallet,removeAccountObj.account)">{{ $t('page_home2.remove_wallet_dia.remove_confrim') }}</el-button>
            </span>
        </el-dialog>

    </div>
</template>

<script>
const fs = require("fs");
let self = null;

export default {
    name: "Home",
    data() {
        return {
            dialogWalletSwitch: {
                create: false,
                remove: false,
                editName: false,
                import: false,
                backUp: false
            },
            dialogAccountSwitch: {
                create: false,
                remove: false
            },
            database: [],
            createWalletInfo: {},
            importWalletInfo: {},
            removeWallet: "",
            editWallet: {
                address: "",
                tag: ""
            },
            downloadWallet: "",

            createAccountInfo: {},
            currentWalletVal: "",
            removeAccountObj: {
                wallet:"",
                account:""
            }
        };
    },
    created() {
        self = this;
        this.initDatabase();
        // this.initWalletCreateInfo();
        // this.initCreateAccountInfo();
        // this.initWalletImportInfo();
    },
    computed: {},
    methods: {
        initDatabase() {
            this.database = this.$db.get("czr_wallets").value();
        },
        initWalletCreateInfo() {
            this.createWalletInfo = {
                tag: this.$t("page_home2.wallet") + (this.database.length + 1),
                pwd: "",
                repwd: "",

                step: 0,
                error: "",

                address: "",
                keystore: null
            };
            this.dialogWalletSwitch.create = true;
        },

        initWalletImportInfo() {
            this.importWalletInfo = {
                tag: this.$t("page_home2.wallet") + (this.database.length + 1),
                pwd: "",
                repwd: "",

                step: 0,
                type: "0",
                alert: null,

                privateKey: "",
                keystore: null
            };
            this.dialogWalletSwitch.import = true;
        },

        initCreateAccountInfo() {
            var walt = this.currentWalletVal;
            let accountsNum = this.$db
                .get("czr_wallets")
                .find({ address: walt })
                .get("account_list")
                .size()
                .value();
            this.createAccountInfo = {
                tag: this.$t("page_home2.acc") + (accountsNum + 1),

                step: 0,
                error: "",

                address: "",
                keystore: null
            };
        },

        getBalance(item) {},

        initWalletInfo: function(params, accounts) {
            let self = this;
            let wallet = this.$db
                .get("czr_wallets")
                .find({ address: params.address })
                .value();
            if (wallet) {
                this.$message.error(
                    this.$t("page_home2.msg_info.exist") +
                        '"' +
                        wallet.tag +
                        '"'
                );
                return;
            }
            this.$db
                .get("czr_wallets")
                .push(params)
                .write();
            this.initDatabase();
            //如果是导入钱包时
            if (accounts) {
                accounts.forEach((element, index) => {
                    var indexVal = index + 1;
                    var options = {
                        address: element,
                        tag: self.$t("page_home2.acc") + indexVal,
                        tx_list: [],
                        balance: 0
                    };

                    self.initAccountInfo(params.address, options);
                });
                this.dialogWalletSwitch.import = false;
                this.$message.success(
                    this.$t("page_home2.msg_info.imported_wallet_success")
                );
            }
        },
        initAccountInfo: function(walt, params) {
            let self = this;
            let $wallet = this.$db.get("czr_wallets").find({ address: walt });

            let accounrt = $wallet
                .get("account_list")
                .find({ address: params.address })
                .value();
            if (accounrt) {
                this.$message.error(
                    this.$t("page_home2.msg_info.exist") +
                        '"' +
                        accounrt.tag +
                        '"'
                );
                return;
            }
            $wallet
                .get("account_list")
                .push(params)
                .write();
            this.initDatabase();
        },
        // Create Wallet
        createWallet: function() {
            var self = this;
            if (!this.createWalletInfo.tag) {
                this.createWalletInfo.error = this.$t(
                    "page_home2.msg_info.wallet_tag_error"
                );
                return;
            }
            if (!this.createWalletInfo.pwd || !this.createWalletInfo.repwd) {
                this.createWalletInfo.error = this.$t(
                    "page_home2.msg_info.enter_password"
                );
                return;
            }
            if (this.createWalletInfo.pwd !== this.createWalletInfo.repwd) {
                this.createWalletInfo.error = this.$t(
                    "page_home2.msg_info.incons_password"
                );
                return;
            }
            if (
                this.createWalletInfo.pwd.length < 8 ||
                this.createWalletInfo.repwd.length < 8
            ) {
                this.createWalletInfo.error = this.$t(
                    "page_home2.create_wallet_dia.strong_password"
                );
                return;
            }
            this.$czr.request
                .walletCreate()
                .then(function(data) {
                    self.createWalletInfo.address = data.wallet;
                    console.log("OK", self.createWalletInfo.address);
                    return data.wallet;
                })
                .then(function(data) {
                    let params = {
                        address: data,
                        tag:
                            self.createWalletInfo.tag ||
                            self.$t("page_home2.wallet") +
                                (self.database.length + 1),
                        account_list: []
                    };
                    console.log(params);
                    self.initWalletInfo(params);
                    self.createWalletInfo.step = 1;
                    // self.$czr.request
                    //     .walletExport(self.createWalletInfo.address)
                    //     .then(function(data) {
                    //         console.log("data", data);
                    //         return data.json;
                    //     })
                    //     .then(function(json) {
                    //         self.createWalletInfo.keystore = json;

                    //     });
                });
        },
        downloadKeystore(walletVal) {
            var self = this;
            self.$czr.request
                .walletExport(walletVal)
                .then(function(data) {
                    console.log("data", data);
                    return data.json;
                })
                .then(function(walletJson) {
                    let link = document.createElement("a");
                    link.download = self.getNowTime() + "--" + walletVal;
                    link.style.display = "none";
                    let blob = new Blob([JSON.stringify(walletJson)]);
                    link.href = URL.createObjectURL(blob);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    self.dialogWalletSwitch.create = false;
                    self.dialogWalletSwitch.backUp = false;
                });
        },
        getNowTime: function() {
            let date = new Date();
            let addZero = this.addZero;
            let LocalTime =
                date.getFullYear() +
                "-" +
                addZero(date.getMonth() + 1) +
                "-" +
                addZero(date.getDate()) +
                "-" +
                addZero(date.getHours()) +
                addZero(date.getMinutes()) +
                addZero(date.getSeconds());
            return LocalTime;
        },
        addZero: function(val) {
            return val < 10 ? "0" + val : val;
        },
        //create Wallet End

        // 备份钱包 开始
        showDownloadDia: function(val) {
            this.downloadWallet = val;
            this.dialogWalletSwitch.backUp = true;
        },

        // 备份钱包 结束

        //Import Start
        importWalletKeystore(event) {
            let path = event.dataTransfer.files[0].path;
            fs.readFile(path, "utf8", (err, data) => {
                if (err) {
                    this.$message.error(
                        this.$t("page_home2.msg_info.error") + ":" + err
                    );
                }
                this.importWalletInfo.keystore = JSON.parse(data);
                this.importWalletInfo.alert = {
                    content: this.$t("page_home2.msg_info.imported_success"),
                    type: "success"
                };
            });
        },
        importAccount() {
            let walletObj = null;
            if (!this.importWalletInfo.keystore) {
                this.importWalletInfo.alert = {
                    content: this.$t("page_home2.msg_info.enter_keystore"),
                    type: "error"
                };
                return;
            }
            if (!this.importWalletInfo.pwd) {
                this.importWalletInfo.alert = {
                    content: this.$t("page_home2.msg_info.enter_password"),
                    type: "error"
                };
                return;
            }
            try {
                console.log("导入成功");
                /* walletObj = this.$web3.eth.accounts.decrypt(
                    this.importWalletInfo.keystore,
                    this.importWalletInfo.pwd
                ); */
            } catch (e) {
                console.log("importWalletError", e);
                this.importWalletInfo.alert = {
                    content: this.$t("page_home2.msg_info.error_password"),
                    type: "error"
                };
                return;
            }

            let params = {
                address:
                    "B20BE6108217ED87AEB097E804AF6C9D9F6EE6CA40CC8D01EC8735B2C6A7FF99" ||
                    walletObj.address,
                tag:
                    this.importWalletInfo.tag ||
                    this.$t("page_home2.wallet") + (this.database.length + 1),
                keystore: this.importWalletInfo.keystore,
                account_list: []
            };
            this.$czr.request
                .accountListByWallet(params.address)
                .then(function(data) {
                    console.log("OK", data.accounts);
                    return data.accounts;
                })
                .then(function(accounts) {
                    //插入钱包和账户
                    self.initWalletInfo(params, accounts);
                });

            /* this.$web3.eth
                .getBalance(params.address)
                .then(data => {
                    params.balance = data;
                    this.initAccount(params);
                    this.dialogWalletSwitch.import = false;
                })
                .catch(console.log); */
        },
        //Import End

        // Remove Wallet Start
        showRemoveWalletDia: function(currentWallet) {
            this.removeWallet = currentWallet;
            console.log(this.removeWallet);
            this.dialogWalletSwitch.remove = true;
        },
        removeWalletFn: function(walletVal) {
            var self = this;
            self.$czr.request
                .walletDestroy(walletVal)
                .then(function(data) {
                    console.log("OK", data);
                    return data;
                })
                .then(function(data) {
                    if (!data.error) {
                        self.$db
                            .get("czr_wallets")
                            .remove({ address: walletVal })
                            .write();
                        self.$message.success(
                            self.$t("page_home2.msg_info.remove_success")
                        );
                        self.initDatabase();
                        self.dialogWalletSwitch.remove = false;
                    } else {
                        self.$message.error(
                            self.$t(data.error)
                        );
                    }
                });
        },
        // Remove Wallet End

        //Edit Tag Start
        showEditWalletDia: function(val, tag) {
            this.editWallet = {
                address: val,
                tag: tag
            };
            this.dialogWalletSwitch.editName = true;
        },

        setWalletTag: function() {
            var self = this;
            this.$db
                .read()
                .get("czr_wallets")
                .find({ address: this.editWallet.address })
                .assign({ tag: this.editWallet.tag })
                .write();
            this.initDatabase();
            this.dialogWalletSwitch.editName = false;
        },
        //Edit Tag End
        // Create Account Start
        showCreateAccDia: function(WalletVal) {
            this.currentWalletVal = WalletVal;
            this.dialogAccountSwitch.create = true;
        },
        createAccount: function() {
            var self = this;
            if (!this.createAccountInfo.tag) {
                this.createAccountInfo.error = this.$t(
                    "page_home2.msg_info.tag"
                );
                return;
            }
            var currentWalVal = this.currentWalletVal;
            this.$czr.request
                .accountCreate(currentWalVal)
                .then(function(data) {
                    self.createAccountInfo.address = data.account;
                    console.log("OK", self.createAccountInfo.address);
                    return data.account;
                    // self.accountValidate();
                    // self.getAccounsBalan();
                    // self.walletAccountList();
                })
                .then(function(data) {
                    let params = {
                        address: data,
                        tag:
                            self.createAccountInfo.tag ||
                            self.$t("page_home2.acc") +
                                (self.database.length + 1),
                        tx_list: [],
                        balance: 0
                    };
                    console.log(params);
                    self.initAccountInfo(currentWalVal, params);
                    self.createAccountInfo.step = 1;
                });
        },
        //DELE Account
        showRemoveAccountDia: function(wallet,account) {
            this.removeAccountObj.wallet = wallet;
            this.removeAccountObj.account = account;
            this.dialogAccountSwitch.remove = true;
        },
        removeAccountFn: function(WalletVal,accVal) {
            var self = this;
            self.$czr.request
                .accountRemove(WalletVal,accVal)
                .then(function(data) {
                    console.log("OK", data);
                    return data;
                })
                .then(function(data) {
                    if (!data.error) {
                        self.$db
                            .get("czr_wallets")
                            .remove({ address: accVal })
                            .write();
                        self.$message.success(
                            self.$t("page_home2.msg_info.remove_success")
                        );
                        self.initDatabase();
                        self.dialogAccountSwitch.remove = false;
                    } else {
                        self.$message.error(
                            self.$t(data.error)
                        );
                    }
                });
        },
    },
    filters: {
        toEthVal: function(val) {
            let tempVal = self.$czr.utils.fromWei(val, "czr");
            return tempVal; //TODO Keep 4 decimal places
        }
    }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.page-czr-home {
}
.home-banner {
    width: 100%;
    text-align: center;
    height: 175px;
    background-image: linear-gradient(
        45deg,
        #2d2b5d 0%,
        #4d4d8f 50%,
        #5a59a0 100%
    );
}
.home-banner .icon-logo {
    color: #fff;
    font-size: 80px;
}
.holder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 150px;
    border: 1px dashed #6ab0df;
    background: #e7f2fa;
    margin-bottom: 10px;
    border-radius: 4px;
}
.wallet-wrap {
    padding-top: 10px;
}
.wallet-wrap .wallet-item {
    margin-bottom: 10px;
    padding: 10px 20px;
    position: relative;
    background-color: #fff;
}
.wallet-item .wallet-action {
    padding: 10px;
    cursor: pointer;
    font-size: 18px;
    text-align: center;
    color: rgb(204, 204, 204);
}
.wallet-item .wallet-action:hover {
    color: #2d2b5d;
}
.wallet-item .wallet-tag {
    color: #2d2b5d;
}

.wallet-item .wallet-address {
    color: #9a9c9d;
}
.backup-wallet {
    width: 100%;
    color: #9a9c9d;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
    color: #e6a23c;
}
.remove-wallet {
    width: 100%;
    color: #9a9c9d;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
    color: #f56c6c;
}

/* account */
.account-wrap {
    /* padding-top: 64px; */
    margin-top: 10px;
    /* width: 100%; */
    /* background: #1E8FAA; */
    padding: 0 20px;
    margin-left: -20px;
    flex-wrap: wrap;
}
.accounrt-item {
    width: 218px;
    text-align: center;
    border: 1px transparent;
    padding: 44px 10px 10px 10px;
    position: relative;
    margin: 40px 0 20px 20px;
    background-color: #f2f2f2;
    cursor: pointer;
    -webkit-user-select: none;
}
.accounrt-item.add-account {
    border: 1px dashed #dddddd;
    padding-top: 24px;
    padding-bottom: 30px;
    /* background: linear-gradient(white,white) padding-box,
    repeating-linear-gradient(-45deg,#ccc 0, #ccc 2px ,white 0,white 8px); */
}
.accounrt-item .account-assets {
    font-size: 24px;
    color: #2d2b5d;
}
/* .accounrt-item .account-avatar{
  position: absolute;
  top: -32px;
  left: 88px;
  width: 64px;
  height: 64px;
  border-radius:50%;
  text-align: center; 
  background-color: #1E8FAA ;
} */
.accounrt-item .account-avatar {
    position: absolute;
    top: -16px;
    left: 86px;
    width: 64px;
    height: 40px;
    background: #4d4d8f;
}
.accounrt-item .account-avatar:before {
    content: "";
    position: absolute;
    top: -16px;
    left: 0;
    width: 0;
    height: 0;
    border-left: 32px solid transparent;
    border-right: 32px solid transparent;
    border-bottom: 16px solid #4d4d8f;
}
.accounrt-item .account-avatar:after {
    content: "";
    position: absolute;
    bottom: -16px;
    left: 0;
    width: 0;
    height: 0;
    border-left: 32px solid transparent;
    border-right: 32px solid transparent;
    border-top: 16px solid #4d4d8f;
}

.accounrt-item .account-avatar .ico-avatar {
    color: #fff;
    font-size: 34px;
    margin-top: -5px;
}
.accounrt-item .delete-acc {
    position: absolute;
    right: 10px;
    top: 10px;
    padding: 10px;
    cursor: pointer;
    text-align: center;
    color: rgb(204, 204, 204);
}
.accounrt-item .delete-acc:hover {
    color: #2d2b5d;
}
.accounrt-item .account-address {
    max-width: 220px;
    margin-top: 12px;
    color: #9a9c9d;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
}
.accounrt-item .account-cont {
    margin-top: 10px;
}
.accounrt-item .icon-add-acc {
    font-size: 48px;
    color: #9a9c9d;
}
.accounrt-item .add-acc-des {
    color: #9a9c9d;
}

.demo-hist {
    margin-top: 200px;
}
.remove-acc {
    color: #f56c6c;
}

.el-dialog h2 {
    font-weight: 400;
}
.el-dialog .text,
.el-dialog .el-textarea,
.el-dialog .el-alert,
.el-dialog .el-input,
.el-dialog .text {
    margin-bottom: 10px;
}
.el-dialog .el-input .el-input-group__prepend {
    width: 200px;
}
.import-type-wrap {
    text-align: center;
}
</style>
