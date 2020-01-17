const { session } = require("electron");
const events = require('events');

const myEmitter = new events.EventEmitter();

let XSRF = null;
let CSRF = null;
let CID = null;
let SID = null;
let UID = null;
const init = () => {

    const filter = {
        urls: ['https://*.forgeofempires.com/', "https://*.forgeofempires.com/page/", "https://*.forgeofempires.com/game/login", "https://*.forgeofempires.com/game/index?"]
    }

    session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
        if (undefined !== details.responseHeaders["set-cookie"]) {
            details.responseHeaders["set-cookie"].forEach(cookie => {
                if (cookie.indexOf('XSRF') > -1) {
                    XSRF = cookie.split(';')[0].replace("XSRF-TOKEN=", "");
                    myEmitter.emit("XSRF_Loaded",XSRF);
                }
                if (cookie.indexOf('csrf') > -1) {
                    CSRF = cookie.split(';')[0].replace("csrf=", "");
                    myEmitter.emit("CSRF_Loaded",CSRF);
                }
            });
        }
        callback({ requestHeaders: details.requestHeaders })
    })

    session.defaultSession.webRequest.onCompleted(filter,(details,callback) =>{
        if(details.url.indexOf(".forgeofempires.com/game/index?") > -1){
            
        }
    })

    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        if (undefined !== details.requestHeaders["Cookie"]) {
            cookie = details.requestHeaders["Cookie"];
            if (cookie.indexOf('cid') > -1) {
                CID = cookie.split(';').find(e => (e.indexOf("cid") > -1)).replace("cid=", "");
                myEmitter.emit("CID_Loaded",CID);
            }
            if (cookie.indexOf('sid') > -1) {
                SID = cookie.split(';').find(e => (e.indexOf("sid") > -1)).replace("sid=", "");
                myEmitter.emit("SID_Loaded",SID);
            }
        }
        callback({ requestHeaders: details.requestHeaders })
    })
}

exports.emitter = myEmitter;
exports.init = init;
exports.XSRF = XSRF;
exports.CSRF = CSRF;
exports.CID = CID;
exports.SID = SID;
exports.UID = UID;