global.fetch = require('electron-fetch').default;
const events = require('events');
const crypto = require('crypto');
const FoBCore = require("./FoBCore");

const myEmitter = new events.EventEmitter();
let WorldID = null,
    User_Key = null,
    Secret = null;

const init = (UID, VS, WID) => {
    User_Key = UID;
    Secret = VS;
    WorldID = WID;
}

const GetStartup = () => {
    return GetStartupData();
}
const DoMotivate = (playerid) => {
    return Motivate(playerid);
}
const VisitTavern = (playerid) => {
    return SittAtTavern(playerid);
}
const GetClanMember = () => {
    return GetClanMemberData();
}
const GetFriends = () => {
    return GetFriendsData();
}
const GetNeighbor = () => {
    return GetNeighborData();
}
const GetLGs = (playerid) =>{
    return GetLGData(playerid);
}

const GetLGData = (playerID) =>{
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [playerID];
    x[0]["requestClass"] = "GreatBuildingsService";
    x[0]["requestMethod"] = "getOtherPlayerOverview";
    x[0]["requestId"] = 1;
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const GetStartupData = () => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [];
    x[0]["requestClass"] = "StartupService";
    x[0]["requestMethod"] = "getData";
    x[0]["requestId"] = 1;
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const Motivate = (playerID) => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [playerID];
    x[0]["requestClass"] = "OtherPlayerService";
    x[0]["requestMethod"] = "polivateRandomBuilding";
    x[0]["requestId"] = FoBCore.getRandomInt(255);
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const SittAtTavern = (playerID) => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [playerID];
    x[0]["requestClass"] = "FriendsTavernService";
    x[0]["requestMethod"] = "getOtherTavern";
    x[0]["requestId"] = FoBCore.getRandomInt(255);
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const GetClanMemberData = () => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [];
    x[0]["requestClass"] = "OtherPlayerService";
    x[0]["requestMethod"] = "getClanMemberList";
    x[0]["requestId"] = FoBCore.getRandomInt(255);
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const GetFriendsData = () => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [];
    x[0]["requestClass"] = "OtherPlayerService";
    x[0]["requestMethod"] = "getFriendsList";
    x[0]["requestId"] = FoBCore.getRandomInt(255);
    let sig = calcSig(x);
    return fetchData(x, sig);
}
const GetNeighborData = () => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [];
    x[0]["requestClass"] = "OtherPlayerService";
    x[0]["requestMethod"] = "getNeighborList";
    x[0]["requestId"] = FoBCore.getRandomInt(255);
    let sig = calcSig(x);
    return fetchData(x, sig);
}

async function fetchData(x, sig) {
    let res = await fetch("https://" + WorldID + ".forgeofempires.com/game/json?h=" + User_Key, {
        "credentials": "include",
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7",
            "cache-control": "no-cache",
            "client-identification": "version=1.169; requiredVersion=1.169; platform=bro; platformType=html5; platformVersion=web",
            "content-type": "application/json",
            "pragma": "no-cache",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "signature": sig
        },
        "referrer": "https://" + WorldID + ".forgeofempires.com/game/index?",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": JSON.stringify(x).replace(' ', ''),
        "method": "POST",
        "mode": "cors"
    });
    if (res.status === 200) {
        let body = await res.text();
        return JSON.parse(body);
    }
    else
        return JSON.parse("[]");
}

const calcSig = (x) => {
    let encoded = JSON.stringify(x).replace(' ', '')
    data = User_Key + Secret + encoded
    return crypto.createHash('md5').update(data).digest('hex').substr(0, 10);
}

exports.emitter = myEmitter;
exports.init = init;
exports.User_Key = User_Key;
exports.Secret = Secret;
exports.GetStartup = GetStartup;
exports.DoMotivate = DoMotivate;
exports.VisitTavern = VisitTavern;
exports.GetClanMember = GetClanMember;
exports.GetFriends = GetFriends;
exports.GetNeighbor = GetNeighbor;
exports.GetLGs = GetLGs;