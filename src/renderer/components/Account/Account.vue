<template>
    <div class="page-account-detail">
        <div class="account-banner">
            <div class="active-icon">
                <router-link :to="'/transfer?account=' + address" tag="div" class="acc-interactive">
                    <i class="iconfont">&#xe605;</i>
                    <p class="icon-des">{{ $t('page_account.active_icon.go_transfer') }}</p>
                </router-link>
                <div class="acc-interactive" @click="exportKeystore">
                    <i class="iconfont">&#xe638;</i>
                    <p class="icon-des">{{ $t('page_account.active_icon.import_keystore') }}</p>
                </div>

                <div class="acc-interactive" @click="showQrCode">
                    <i class="iconfont">&#xe628;</i>
                    <p class="icon-des">{{ $t('page_account.active_icon.qrcode') }}</p>
                </div>
            </div>

            <div class="account-center">
                <div class="account-alias-wrap">
                    <span class="text-sub-color">{{ accountInfo.tag }}</span>
                    <i class="iconfont icon-edit-alias" @click="dialogSwitch.editName = true"> &#xe604; </i>
                </div>
                <div class="account-has-assets">
                    <h1 class="account-assets">{{ accountInfo.balance | toCZRVal }}</h1>
                    <span>{{ $t('unit.czr') }}</span>
                </div>
                <div class="account-address-wrap">
                    <span class="text-sub-color">{{ address }}</span>
                    <i class="iconfont icon-address-copy" @click="copyAddress"> &#xe645; </i>
                </div>
            </div>

        </div>

        <div class="account-content">
            <h2 class="transfer-tit">{{ $t('page_account.transfer_log') }}</h2>
            <div class="transfer-log">
                <template v-for="item in accountInfo.tx_list">
                    <div v-if="item.to == address">
                        <div class="transfer-item b-flex b-flex-justify tx-item plus-assets" @click="showTxInfo(item)">
                            <div class="icon-wrap">
                                <i class="iconfont icon-transfer">&#xe639;</i>
                            </div>
                            <div class="transfer-info">
                                <p class="by-address">{{item.from}}</p>
                                <p class="transfer-time">{{item.exec_timestamp |toDate }}</p>
                            </div>
                            <div class="transfer-assets">
                                <div class="assets">+ {{item.amount | toCZRVal }}</div>
                            </div>
                        </div>
                    </div>

                    <div v-if="item.from == address">
                        <div class="transfer-item b-flex b-flex-justify tx-item less-assets" @click="showTxInfo(item)">
                            <div class="icon-wrap">
                                <i class="iconfont icon-transfer">&#xe638;</i>
                            </div>
                            <div class="transfer-info">
                                <p class="by-address">{{item.to}}</p>
                                <p class="transfer-time">{{item.exec_timestamp |toDate }}</p>
                            </div>
                            <div class="transfer-assets">
                                <div class="assets">- {{item.amount | toCZRVal }}</div>
                            </div>
                        </div>
                    </div>
                </template>
                <div class="pagin-wrap b-flex b-flex-justify" v-if="accountInfo.tx_list.length>2">
                    <el-button :disabled="pagingSwitch.before" class="before-btn">上一页</el-button>
                    <el-button  :disabled="pagingSwitch.next" class="next-btn">下一页</el-button>
                </div>
            </div>

            <!--  No transaction record  -->
            <div v-if="accountInfo.tx_list.length==0" class="no-transfer-log">
                <i class="iconfont">&#xe6e7;</i>
                <p>{{ $t('page_account.transfer_log_null') }}</p>
            </div>
        </div>

        <el-dialog :title="$t('dialog_tit')" :visible.sync="dialogSwitch.qrCode" width="40%" center>
            <span>
                <img :src="qrImgUrl" alt="code" class="qrcode-img">
                <p class="dia-address">{{address}}</p>
            </span>
            <!-- <span slot="footer" class="dialog-footer">
        <el-button @click="dialogSwitch.qrCode = false">{{$t('close')}}</el-button>
      </span> -->
        </el-dialog>

        <el-dialog :title="$t('page_account.edit_dia.tit')" :visible.sync="dialogSwitch.editName" width="35%" center>
            <span>
                <p class="edit-name-subtit">{{$t('page_account.edit_dia.subtit')}}</p>
                <el-input v-model="editTag"></el-input>
            </span>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogSwitch.editName = false">{{$t('cancel')}}</el-button>
                <el-button type="primary" @click="setEditTag">{{$t('confirm')}}</el-button>
            </span>
        </el-dialog>

        <el-dialog :title="$t('page_account.keystore.copy')" :visible.sync="dialogSwitch.keystore">
            <el-input v-if="accountInfo" :value="accountInfo.keystore" type="textarea" :autosize="{minRows: 2}">
            </el-input>
            <div slot="footer">
                <el-button @click="copyKeystore">{{$t('page_account.keystore.copy')}}</el-button>
                <el-button type="primary" @click="downloadKeystore">{{$t('page_account.keystore.download')}}</el-button>
            </div>
        </el-dialog>

        <!-- tx info -->
        <el-dialog :title="$t('page_account.dia_tx.tit')" :visible.sync="dialogSwitch.txInfo" width="70%">
            <ul class="dialog-tx-wap">
                <li class="b-flex b-flex-justify tx-item tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.block_hash')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.blockHash}}</span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.status')}}</strong>
                    <span class="tx-item-info">
                        <span v-if="txStatus === -1" class="txt-warning">
                            不稳定
                        </span>
                        <span v-else-if="txStatus === 200" class="txt-success">
                            成功
                        </span>
                        <span v-else-if="txStatus === 300" class="txt-info">
                            作废
                        </span>
                        <span v-else-if="txStatus === 400" class="txt-danger">
                            失败
                        </span>
                    </span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.from')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.from}}</span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.to')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.to}}</span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.amount')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.amount| toCZRVal}} {{ $t('unit.czr') }}</span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.data')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.data}}</span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.send_time')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.exec_timestamp|toDate}}</span>
                </li>
                <li class="b-flex b-flex-justify tx-item">
                    <strong class="tx-item-des">{{$t('page_account.dia_tx.mac_time')}}</strong>
                    <span class="tx-item-info">{{transactionInfo.mc_timestamp|toDate}}</span>
                </li>
            </ul>
        </el-dialog>

    </div>
</template>

<script>
const { clipboard } = require("electron");
import QRCode from "qrcode";
import { setInterval, clearInterval } from "timers";

let self = null;

export default {
    name: "Account",
    data() {
        return {
            dialogSwitch: {
                qrCode: false,
                editName: false,
                keystore: false,
                txInfo: false
            },
            pagingSwitch: {
                before:true,
                next:false
            },
            address: this.$route.params.id,
            accountInfo: null,
            transactionInfo: null,
            pollingAry: null,
            qrImgUrl: "",
            txStatus: "-",
            editTag: ""
        };
    },
    created() {
        self = this;
        QRCode.toDataURL(this.address, { width: 800 }, function(err, url) {
            if (err) {
                self.$logger.info(err);
                return;
            }
            self.qrImgUrl = url;
        });
        self.initDatabase();
        self.initTag();
        self.initTransactionInfo();

        this.accountIntervalId = setInterval(() => {
            self.initDatabase();
        }, 2000);
    },
    computed: {},
    beforeDestroy() {
        clearInterval(this.accountIntervalId);
    },
    methods: {
        //Ini
        initTag: function() {
            this.editTag = this.accountInfo.tag;
        },
        initTransactionInfo() {
            this.transactionInfo = {
                blockHash: "", //哈希值
                from: "",
                to: "",
                amount: "",
                previous: "",
                parents: "",
                witness_list: "",
                witness_list_block: "",
                last_summary: "",
                last_summary_block: "",
                data: "",
                exec_timestamp: "",
                signature: ""
            };
        },
        initDatabase() {
            var keystoreFile;
            if (this.accountInfo) {
                keystoreFile = this.accountInfo.keystore;
            }
            this.accountInfo = this.$db
                .read()
                .get("czr_accounts")
                .filter({ address: this.address })
                .value()[0];
            this.accountInfo.keystore = keystoreFile;
            // this.accountInfo.tx_list = [
            //     //get List
            // ];
        },

        //Copy Address
        copyAddress: function() {
            clipboard.writeText(this.address);
            this.$message({
                message: this.$t("page_account.msg_info.ads_copy_success"),
                type: "success"
            });
        },

        //SHOW tx info
        showTxInfo(item) {
            this.transactionInfo = item;
            //判断 this.txStatus
            if (item.is_stable == "0") {
                //不稳定
                this.txStatus = -1; //不稳定
            } else if (item.is_stable == "1") {
                //稳定
                if (item.is_fork == "1" || item.is_invalid == "1") {
                    this.txStatus = 300; //作废
                    //
                } else {
                    if (item.is_fail == "1") {
                        this.txStatus = 400; //失败
                    } else {
                        this.txStatus = 200; //成功
                    }
                }
            }

            this.dialogSwitch.txInfo = true;
        },

        //Show Qrcode
        showQrCode: function() {
            this.dialogSwitch.qrCode = true;
        },

        //Edit Tag
        setEditTag: function() {
            var self = this;
            this.$db
                .read()
                .get("czr_accounts")
                .find({ address: this.address })
                .assign({ tag: this.editTag })
                .write();
            this.accountInfo.tag = this.editTag;
            this.dialogSwitch.editName = false;
        },

        //export Keystore
        exportKeystore() {
            var self = this;
            self.$czr.request
                .accountExport(self.accountInfo.address)
                .then(function(data) {
                    return data.json;
                })
                .then(function(accJson) {
                    self.accountInfo.keystore = accJson;
                    self.dialogSwitch.keystore = true;
                });
        },

        //copy
        copyKeystore() {
            // clipboard.writeText(JSON.stringify(this.accountInfo.keystore));
            clipboard.writeText(this.accountInfo.keystore);
            this.$message.success(
                this.$t("page_account.msg_info.key_copy_success")
            );
            this.dialogSwitch.keystore = false;
        },

        //download
        downloadKeystore() {
            let link = document.createElement("a");
            link.download = this.getNowTime() + "--" + this.address;
            link.style.display = "none";
            // let blob = new Blob([JSON.stringify(this.accountInfo.keystore)]);
            let blob = new Blob([this.accountInfo.keystore]);
            link.href = URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.dialogSwitch.keystore = false;
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
        }
    },
    filters: {
        toCZRVal: function(val) {
            let tempVal = self.$czr.utils.fromWei(val, "czr");
            return tempVal; //TODO Keep 4 decimal places
        },
        toDate: function(val) {
            if (val == "0" || !val) {
                return "-";
            }
            let newDate = new Date();
            newDate.setTime(val * 1000);
            let addZero = function(val) {
                return val < 10 ? "0" + val : val;
            };
            return (
                newDate.getFullYear() +
                " / " +
                addZero(newDate.getMonth() + 1) +
                " / " +
                addZero(newDate.getDate()) +
                " " +
                addZero(newDate.getHours()) +
                ":" +
                addZero(newDate.getMinutes()) +
                ":" +
                addZero(newDate.getSeconds())
            );
        }
    }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.account-banner {
    height: 175px;
    text-align: center;
    background-color: #5a59a0;
    color: #fff;
    width: 100%;
    /* -webkit-user-select: none; */
    position: relative;
}

.account-banner .active-icon {
    padding: 10px 10px;
    min-width: 200px;
    position: absolute;
    top: 0;
    right: 0;
}
.account-banner .acc-interactive {
    margin: 10px;
    display: inline-block;
}
.account-banner .acc-interactive:hover {
    cursor: pointer;
}
.account-banner .acc-interactive:hover .icon-des {
    color: #e7e7ff;
}
.account-banner .acc-interactive:hover .iconfont {
    color: #e7e7ff;
}
.account-banner .acc-interactive .iconfont {
    font-size: 18px;
    color: #bfbef8;
}
.account-banner .icon-des {
    font-size: 12px;
    min-width: 40px;
    color: #bfbef8;
}

.account-banner .account-center {
    z-index: 20;
    width: 520px;
    margin: 0 auto;
    /* text-align: left; */
}
.account-banner .account-center .iconfont {
    color: #c4c3f7;
    cursor: pointer;
    width: 24px;
    height: 24px;
}
.account-banner .account-center .iconfont:hover {
    color: #e7e7ff;
}
.account-center {
    padding-top: 38px;
}
.account-has-assets {
    margin: 10px 0 15px;
}
.account-has-assets .account-assets {
    font-size: 24px;
    display: inline-block;
}

.account-content {
    text-align: left;
    padding: 0 20px;
    margin-top: 40px;
}
.account-content .transfer-tit {
    font-size: 18px;
    font-weight: 400;
}

/* Transaction Record */
.account-content .no-transfer-log {
    text-align: center;
    color: #9b9b9b;
}
.account-content .no-transfer-log .iconfont {
    font-size: 128px;
}
.account-content .transfer-log {
    padding: 22px 0;
}

.transfer-log .transfer-item {
    background-color: #fff;
    padding: 10px 15px;
    margin-bottom: 2px;
    cursor: pointer;
    -webkit-user-select: none;
}
.account-content .transfer-log .transfer-info {
    width: 480px;
    text-align: left;
}
.transfer-log .icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: 50%;
}
.transfer-log .icon-wrap .icon-transfer {
    color: #fff;
    position: relative;
    left: 11px;
    top: 4px;
    font-size: 20px;
}
.transfer-log .plus-assets .icon-wrap {
    background-color: rgba(0, 128, 0, 0.555);
}
.transfer-log .less-assets .icon-wrap {
    background-color: rgba(255, 153, 0, 0.555);
}
.transfer-log .by-address {
    width: 100%;
    color: #9a9c9d;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
    color: rgb(54, 54, 54);
}
.transfer-log .transfer-time {
    color: rgb(161, 161, 161);
}
.transfer-log .transfer-assets .assets {
    font-size: 18px;
    height: 42px;
    line-height: 42px;
    width: 170px;
    text-align: right;
}
.plus-assets .assets {
    color: green;
}
.less-assets .assets {
    color: rgb(255, 51, 0);
}
.qrcode-img {
    width: 100%;
    height: auto;
    display: block;
}
.dia-address {
    text-align: center;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
}
.edit-name-subtit {
    margin-bottom: 30px;
    text-align: center;
}

.dialog-tx-wap .tx-item {
    padding: 10px 0 10px;
    border-bottom: 1px solid #f3f3f3;
}
.tx-item-des {
    width: 160px;
}
.tx-item-info {
    width: 80%;
    padding-left: 10px;
    text-align: right;
    color: #9a9c9d;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
}
.pagin-wrap {
    padding: 15px 0;
}
.txt-warning {
    color: #e6a23c;
}
.txt-info {
    color: #909399;
}
.txt-success {
    color: #67c23a;
}
.txt-danger {
    color: #f56c6c;
}
</style>
