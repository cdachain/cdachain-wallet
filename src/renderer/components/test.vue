<template>
<div>
    <h1>test </h1>
    <p>wallet:{{wallet}}</p>
    <p>account:{{account}}</p>
    <p>isAccount:{{isAccount}}</p>
    <p>balances:{{balances}}</p>
    <p>the_wallet_account_list:{{the_wallet_account_list}}</p>
</div>
</template>

<script>
export default {
    name: "Test",
    data() {
        return {
            wallet:'',//wallet:    
            account:"",//account: czr_1nm65w6br6kpdu7awkoikbnaf5u8nx7n67gnty4x1puqequmm76hnx67w69s   
            isAccount:"",
            the_wallet_account_list:null, 
            balances:null
        };
    },
    created() {
        this.testFn();
        
        this.creatAccount();//创建账号
        // this.accountValidate();//验证账号

        // this.getAccounsBalan();//批量获取余额
        this.walletAccountList();//批量钱包下的账号 
    },
    methods: {
        testFn () {
            console.log("+++++++++++++++++++start",this.$czr);
        },


        creatAccount(){
            /* 
            TODO 基于钱包，创建账号
            1.是否创建钱包，
                如果创建-获取
                如果没有创建 -  创建一个
            2.用钱包字段，创建钱包 

            ？？ 用户密码在哪里输入？  
            
            */
        
            var self=this;
            this.$czr.request.walletCreate().then(function (data) {
                self.wallet=data.wallet
                console.log("1-1.wallet:>>>",data);
                return data.wallet;
            }).then(function(walletVal){
                console.log("新创建的钱包是",walletVal)
                self.$czr.request.accountCreate(walletVal).then(function (data) {
                    // self.wallet=data.wallet
                    self.account=data.account
                    console.log("1-2.account:>>>",data);
                    self.accountValidate();
                    self.getAccounsBalan();
                    self.walletAccountList();
                });
            })


        },

        accountValidate(){
            var self=this;
            this.$czr.request.validateAccount(self.account).then(function (data) {
                self.isAccount=data.valid
                console.log("validateAccount :>>>> ",data);
                // return data.wallet; 
            })
        },

        getAccounsBalan(){
            var self=this;
            var accounts = [self.account];
            this.$czr.request.accountsBalances(accounts).then(function (data) {
                self.balances=data.balances
                console.log("accountsBalances :>>>> ",data);
                // return data.wallet;
            })
        },

        walletAccountList(){
            var self=this;
            console.log("self.wallet",self.wallet)
            this.$czr.request.accountListByWallet(self.wallet).then(function (data) {
                self.the_wallet_account_list=data.accounts
                console.log("accountListByWallet :>>>> ",data);
                // return data.wallet;
            })
        }
    }
};
</script>
