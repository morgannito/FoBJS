export const XSRF = null;
export const CSRF = null;
export const CID = null;
export const SID = null;
export const UID = null;
export function init(){

    const filter = {
        urls: ['https://*.forgeofempires.com/', "https://*.forgeofempires.com/page/", "https://*.forgeofempires.com/game/login", "https://*.forgeofempires.com/game/index?"]
    }

    session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
        if (undefined !== details.responseHeaders["set-cookie"]) {
            details.responseHeaders["set-cookie"].forEach(cookie => {
                if (cookie.indexOf('XSRF') > -1) {
                    XSRF = cookie.split(';')[0].replace("XSRF-TOKEN=", "");
                }
                else if (cookie.indexOf('csrf') > -1) {
                    CSRF = cookie.split(';')[0].replace("csrf=", "");
                }
            });
        }
        callback({ requestHeaders: details.requestHeaders })
    })

    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        if (undefined !== details.requestHeaders["Cookie"]) {
            cookie = details.requestHeaders["Cookie"];
            if (cookie.indexOf('cid') > -1) {
                CID = cookie.split(';').find(e => (e.indexOf("cid") > -1)).replace("cid=", "");
            }
            else if (cookie.indexOf('sid') > -1) {
                SID = cookie.split(';').find(e => (e.indexOf("cid") > -1)).replace("sid=", "");
            }
        }
        callback({ requestHeaders: details.requestHeaders })
    })
}