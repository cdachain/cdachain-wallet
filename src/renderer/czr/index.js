"use strict";
var version = require('./version.json').version;
var utils = require('./utils');
var HttpRequest = require('./httprequest');

var Czr = function Czr(request) {
    if (request) {
		this._request = request;
	}
    // this.version = version;
    // this.utils = utils;
    // this.account = new Account(this);
    this.request = new HttpRequest(this);
};

Czr.prototype={
    constructor:Czr,
    version:version,
    utils:utils,
    setRequest:function(request){
        this._request = request;
        // this.api._setRequest(request);
        // this.admin._setRequest(request);
    }

}

module.exports = Czr;