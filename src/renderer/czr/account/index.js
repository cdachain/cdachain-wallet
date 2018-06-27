var rpc = require('node-json-rpc');

var options = {
    host: '::1',
    port: 7076,
};
var client = new rpc.Client(options);

function asyncfunc(opt) {
    return new Promise((resolve, reject) => {
        client.call(opt,
            function (err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res)
                }
            }
        );
    })
}

// var walletCreate = async function(opt) {
//     let ret = await asyncfunc(opt);
//     return ret;
// };

// var accountCreate = async function(opt) {
//     let ret = await asyncfunc(opt);
//     return ret;
// };

// module.exports = {
//     walletCreate: walletCreate,
//     accountCreate: accountCreate
// };

var Account = function (czr) {
    this.__setRequest(czr._request)
}
Account.prototype = {
    constructor: Account,
    __setRequest : function (request) {
        this._request = request;
    },
    walletCreate:async function(opt) {
        let ret = await asyncfunc(opt);
        return ret;
    },
    accountCreate : async function(opt) {
        let ret = await asyncfunc(opt);
        return ret;
    }
}


module.exports = Account;