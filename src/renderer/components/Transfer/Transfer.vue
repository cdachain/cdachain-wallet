<template>
  <div class="page-transfer">
    <div class="transfer-cont">
      <el-form ref="form" label-width="100px" v-if="this.database.length>0">
        <el-form-item :label="$t('page_transfer.from_address')">
          <el-select v-model="fromInfo.account" :placeholder="$t('page_transfer.select')" style="width:100%;">
            <el-option v-for="item in database" :key="item.address" :label="item.address" :value="item.address">
              <span style="float: left">{{ item.tag }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ item.address }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('page_transfer.to_address')">
          <div class="trigger-contacts" @click="dialogSwitch.contacts = true">
            <i class="el-icon-tickets"></i>
          </div>
          <el-input v-model="toAccount"></el-input>
        </el-form-item>

        <el-form-item :label="$t('page_transfer.amount')">
          <el-input v-model="amount" min="0" :max="accountInfo.balance" class="width-180"></el-input>
          <span>{{$t('unit.czr')}}</span>
          <el-checkbox v-model="checkedAll" @change='sendAllAmount' class="send-all-assets">
            {{$t('page_transfer.send_all')}}&nbsp;
            <span class="czr-txt-muted">
              (&nbsp;{{accountInfo.balance | toEthVal}} {{$t('unit.czr')}}&nbsp;)
            </span>

          </el-checkbox>
        </el-form-item>
        <el-form-item :label="$t('page_transfer.data')">
          <el-input type="textarea" :placeholder="$t('page_transfer.data_placeholder')" v-model="extraData"></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="validateForm">{{$t('confirm')}}</el-button>

        </el-form-item>
      </el-form>
      <div v-else>
        <i class="el-icon-circle-close-outline no-account-icon"></i>
        <p class="no-account-des">{{$t('page_transfer.no_account_info')}}</p>
      </div>
    </div>

    <!-- Dialog select contacts -->
    <el-dialog :title="$t('dialog_tit')" :visible.sync="dialogSwitch.contacts" width="70%">
      <span>
        <el-select v-model="selectedContact" :placeholder="$t('page_transfer.contacts_dig.select_placeholder')" style="width:100%;">
          <el-option v-for="item in contacts" :key="item.address" :label="item.tag" :value="item.address">
            <span style="float: left">{{ item.tag }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px">{{ item.address }}</span>
          </el-option>
        </el-select>
      </span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogSwitch.contacts = false">{{$t('cancel')}}</el-button>
        <el-button type="primary" @click="confrimContacts">{{$t('confirm')}}</el-button>
      </span>
    </el-dialog>

    <!-- confirm tran -->
    <template>
      <el-dialog :title="$t('page_transfer.confirm_dia.title')" width="85%" :visible.sync="dialogSwitch.confrim">

        <el-form ref="form" label-width="120px">
          <el-form-item :label="$t('page_transfer.from_address')">
            <p>{{fromInfo.account}}</p>
          </el-form-item>
          <el-form-item :label="$t('page_transfer.to_address')">
            <p>{{toAccount || "-"}}</p>
          </el-form-item>
          <el-form-item :label="$t('page_transfer.amount')">
            <p>{{amount}} {{$t('unit.czr')}}</p>
          </el-form-item>
          <el-form-item :label="$t('page_transfer.data')">
            <p>{{extraData || '-'}}</p>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="dialogSwitch.confrim = false">{{$t('cancel')}}</el-button>
          <el-button type="primary" @click="dialogSwitch.password = true">{{$t('confirm')}}</el-button>
        </div>

        <el-dialog width="60%" :title="$t('page_transfer.confirm_dia.enter_passworld_tit')" :visible.sync="dialogSwitch.password" append-to-body>
          <el-form ref="form" label-width="100px">
            <el-input v-model="fromInfo.password" :placeholder="$t('page_transfer.confirm_dia.enter_passworld_place')" type="password"></el-input>
          </el-form>

          <div slot="footer" class="dialog-footer">
            <el-button @click="dialogSwitch.password = false">{{$t('cancel')}}</el-button>
            <el-button type="primary" @click="sendTransaction">{{$t('confirm')}}</el-button>
          </div>
        </el-dialog>

      </el-dialog>
    </template>

  </div>
</template>

<script>
import { setInterval } from "timers";
let self = null;
export default {
    name: "Transfer",
    data() {
        return {
            dialogSwitch: {
                contacts: false,
                confrim: false,
                password: false
            },

            database: [],
            contacts: [],

            checkedAll: false,
            selectedContact: "",

            fromInfo: {
                account: "",
                password: ""
            },
            submitInfo: {},

            toAccount: "",
            amount: 0,
            gasPrice: "",
            feePercent: 100,
            gasLimit: 200000, //参考  myetherwallet
            extraData: ""
        };
    },

    created() {
        self = this;
        this.contacts = this.$db.get("czr_contacts.contact_ary").value();

        self.initDatabase();
        if (this.database.length) {
            this.fromInfo = {
                account:
                    this.$route.query.account || this.database[0].address || "",
                password: ""
            };
            this.intervalId = setInterval(() => {
                self.initDatabase();
            }, 2000);
        }
    },

    computed: {
        //Init
        accountInfo() {
            if (this.fromInfo.account) {
                return this.database.find(
                    item => item.address === this.fromInfo.account
                );
            } else {
                return {};
            }
        }
    },
    methods: {
        //Init data
        initDatabase() {
            this.database = this.$db.get("czr_accounts").value();
        },
        //选择联系人
        confrimContacts: function() {
            this.toAccount = this.selectedContact;
            this.dialogSwitch.contacts = false;
        },

        //发送全部金额
        sendAllAmount: function() {
            if (this.checkedAll) {
                let weiVal = this.accountInfo.balance;
                let targetVal = self.$czr.utils.fromWei(weiVal, "czr");
                this.amount = Number(targetVal) >= 0 ? targetVal : 0;
            } else {
                this.amount = 0;
            }
        },

        //确认验证
        validateForm: function() {
            var self = this;
            //金额为0不可以发
            // if (!parseFloat(self.amount)) {
            //     self.$message.error(
            //         self.$t("page_transfer.msg_info.amount_zero")
            //     );
            //     return;
            // }

            if (!self.toAccount) {
                self.$message.error(
                    self.$t("page_transfer.msg_info.address_null")
                );
                return;
            }

            self.$czr.request
                .accountValidate(self.toAccount)
                .then(function(data) {
                    console.log(self.toAccount, "++", data);
                    return data.valid;
                })
                .then(function(data) {
                    if (data == "1") {
                        self.dialogSwitch.confrim = true;
                    } else if (data == "0") {
                        self.$message.error(
                            self.$t("page_transfer.msg_info.address_err")
                        );
                    }
                });
        },

        //send transaction
        sendTransaction: function() {
            let self = this;

            let amountValue = self.$czr.utils.toWei(this.amount, "czr");
            let id = Math.random();

            let sendObj = {
                from: self.fromInfo.account,
                to: self.toAccount,
                amount: amountValue,
                password: self.fromInfo.password,
                data: self.extraData,
                id: id
            };
            console.log("send", sendObj);

            self.$czr.request
                .send(sendObj)
                .then(function(data) {
                    console.log("data", data);
                    return data;
                })
                .then(function(data) {
                    if (!data.error) {
                        console.log("hahahaah", data.block);
                        let receiptData = {
                            blockHash: data.block
                        };
                        let testFrom = self.$db
                            .get("czr_accounts")
                            .find({ address: self.fromInfo.account })
                            .value();
                        let testTo = self.$db
                            .get("czr_accounts")
                            .find({ address: self.toAccount })
                            .value();
                        if (testFrom) {
                            self.$db
                                .get("czr_accounts")
                                .find({ address: self.fromInfo.account })
                                .get("tx_list")
                                .unshift(receiptData)
                                .write();
                        }
                        if (testTo) {
                            self.$db
                                .get("czr_accounts")
                                .find({ address: self.toAccount })
                                .get("tx_list")
                                .unshift(receiptData)
                                .write();
                        }

                        //getBlock
                        self.$czr.request
                            .getBlock(data.block)
                            .then(function(blockInfo) {
                                console.log("data", blockInfo);
                                return blockInfo;
                            })
                            .then(function(blockInfo) {
                                // receiptData 是返回数据
                                // receiptData.timestamp = blockObj.timestamp;
                                if (testFrom) {
                                    self.$db
                                        .get("czr_accounts")
                                        .find({
                                            address: self.fromInfo.account
                                        })
                                        .get("tx_list")
                                        .find({ blockHash: receiptData.blockHash })
                                        .assign(blockInfo)
                                        .write();
                                }
                                if (testTo) {
                                    self.$db
                                        .get("czr_accounts")
                                        .find({ address: self.toAccount })
                                        .get("tx_list")
                                        .find({ blockHash: receiptData.blockHash })
                                        .unshift(blockInfo)
                                        .write();
                                }
                                self.$message.success(
                                    this.$t(
                                        "page_transfer.msg_info.send_success"
                                    )
                                );
                                //Clear data
                                self.dialogSwitch.confrim = false;
                                self.dialogSwitch.password = false;
                                self.$router.push(
                                    "/account/" + self.fromInfo.account
                                );
                            });
                    } else {
                        self.$message.error(data.error);
                    }
                });
            // .catch(err => {
            //     console.log(err);
            //     self.$message.error(
            //         this.$t("page_transfer.msg_info.send_error")
            //     );
            // });

            //Signs an Ethereum transaction with a given private key

            return;
            this.$web3.eth.accounts
                .signTransaction(
                    {
                        to: this.toAccount,
                        gas: this.gasLimit, //Gas Limit
                        data: this.extraData
                        //      }, this.accountInfo.privateKey)
                    },
                    account.privateKey
                )
                .then(hex => {
                    /*{
                messageHash: '0x6893a6ee8df79b0f5d64a180cd1ef35d030f3e296a5361cf04d02ce720d32ec5',
                r: '0x9ebb6ca057a0535d6186462bc0b465b561c94a295bdb0621fc19208ab149a9c',
                s: '0x440ffd775ce91a833ab410777204d5341a6f9fa91216a6f3ee2c051fea6a0428',
                v: '0x25',
                rawTransaction: '0xf86a8086d55698372431831e848094f0109fc8df283027b6285cc889f5aa624eac1f55843b9aca008025a009ebb6ca057a0535d6186462bc0b465b561c94a295bdb0621fc19208ab149a9ca0440ffd775ce91a833ab410777204d5341a6f9fa91216a6f3ee2c051fea6a0428'
            }
            */
                    return this.$web3.eth.sendSignedTransaction(
                        hex.rawTransaction
                    );
                })
                .then(data => {
                    /*
           {
              transactionHash: "0x79606c95358ff6b6f6bd585fa2801a1e2fa418753ff5bf84a00472f8a0eda96f",
              transactionIndex: 0,
              blockHash: "0x657d7609ff7abc77fcde66dc7559e8e631acd8705186c9a17dcaf2111126c761",
              blockNumber: 1,
              contractAddress : null
              cumulativeGasUsed : 21000
              gasUsed : 21000
              logs : Array(0)
              logsBloom : "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
              status : true
           }
*/

                    this.$web3.eth
                        .getTransaction(data.transactionHash)
                        .then(receiptData => {
                            this.$web3.eth
                                .getBlock(data.blockHash)
                                .then(blockObj => {});
                        });
                });
        }
    },
    filters: {
        toEthVal: function(val) {
            // let tempVal = self.$czr.utils.fromWei(val.toString(), "czr");
            let tempVal = self.$czr.utils.fromWei(val, "czr");
            return tempVal; //TODO Keep 4 decimal places
        }
    }
};
</script>
<style scoped>
.page-transfer {
    text-align: left;
    background: #fff;
    border-top: 1px solid rgba(0, 0, 0, 0.25);
    padding: 40px 0 35px;
}
.transfer-cont {
    padding: 0 90px;
    min-height: 450px;
}
.page-transfer .bui-form-selector {
    width: 420px;
    font-size: 14px;
}
.page-transfer .bui-form-item {
    padding-left: 220px;
}
.tran_input {
    width: 300px;
}
.select-none {
    -webkit-user-select: none;
}
.expected-assets {
    margin-top: 14px;
}

.trigger-contacts {
    width: 50px;
    height: 38px;
    background: #fff;
    position: absolute;
    right: 1px;
    top: 1px;
    z-index: 2;
    border-radius: 4px;
    cursor: pointer;
}
.trigger-contacts .el-icon-tickets {
    font-size: 24px;
    padding-left: 13px;
    padding-top: 7px;
    color: #a7aaaf;
}
.trigger-contacts:hover {
    background: #dbdbff;
}
.trigger-contacts:hover .el-icon-tickets {
    color: #5a59a0;
}

.send-all-assets {
    margin-left: 20px;
    font-size: 16px;
}
.speculate-wrap {
    color: rgb(168, 168, 168);
}
.no-account-icon {
    font-size: 100px;
    display: block;
    text-align: center;
    margin-top: 50px;
}
.no-account-des {
    text-align: center;
    margin-top: 40px;
}
</style>
