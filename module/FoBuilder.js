global.fetch = require('electron-fetch').default;
const events = require('events');
const crypto = require('crypto');
const FoBCore = require("./FoBCore");
const FoBMain = require("../main");

const myEmitter = new events.EventEmitter();

var WorldID = null,
    User_Key = null,
    Secret = null,
    VersionMajorMinor = null;

const init = (UID, VS, VMM, WID) => {
    User_Key = UID;
    Secret = VS;
    WorldID = WID;
    VersionMajorMinor = VMM;
}

const GetStartup = () => {
    return GetStartupData();
}
const DoMotivate = (playerid) => {
    return Motivate(playerid);
}
const DoCollectReward = (rewardid) => {
    return CollectReward(rewardid);
}
const VisitTavern = (playerid) => {
    return SittAtTavern(playerid);
}
const GetClanMember = () => {
    return GetClanMemberData();
}
const GetEntities = () => {
    return GetEntitiesData();
}
const GetFriends = () => {
    return GetFriendsData();
}
const GetNeighbor = () => {
    return GetNeighborData();
}
const GetLGs = (playerid) => {
    return GetLGData(playerid);
}
const DoLogService = () => {
    return LogService();
}
const DoCollectProduction = (ids) => {
    return CollectProduction(ids);
}
const DoQueryProduction = (id, prodID) => {
    return QueryProduction(id, prodID);
}
const DoCancelProduction = (id) => {
    return CancelProduction(id);
}
const DoCollectTavern = () => {
    return CollectTavern();
}

const CollectProduction = (ids) => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [ids];
    x[0]["requestClass"] = "CityProductionService";
    x[0]["requestMethod"] = "pickupProduction";
    x[0]["requestId"] = FoBCore.getNextRequestID();
    
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const QueryProduction = (id, prodID) => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [id, prodID];
    x[0]["requestClass"] = "CityProductionService";
    x[0]["requestMethod"] = "startProduction";
    x[0]["requestId"] = FoBCore.getNextRequestID();
    
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const CancelProduction = (id) => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [id];
    x[0]["requestClass"] = "CityProductionService";
    x[0]["requestMethod"] = "cancelProduction";
    x[0]["requestId"] = FoBCore.getNextRequestID();
    
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const CollectReward = (rewardid) => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [rewardid];
    x[0]["requestClass"] = "HiddenRewardService";
    x[0]["requestMethod"] = "collectReward";
    x[0]["requestId"] = FoBCore.getNextRequestID();
    
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const GetLGData = (playerID) => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [playerID];
    x[0]["requestClass"] = "GreatBuildingsService";
    x[0]["requestMethod"] = "getOtherPlayerOverview";
    x[0]["requestId"] = FoBCore.getNextRequestID();
    
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

const LogService = () => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [{ "__class__": "FPSPerformance", "module": "City", "fps": 30, "vram": 0 }];
    x[0]["requestClass"] = "LogService";
    x[0]["requestMethod"] = "logPerformanceMetrics";
    x[0]["requestId"] = FoBCore.getNextRequestID();
    
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const Motivate = (playerID) => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [playerID];
    x[0]["requestClass"] = "OtherPlayerService";
    x[0]["requestMethod"] = "polivateRandomBuilding";
    x[0]["requestId"] = FoBCore.getNextRequestID();
    
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const SittAtTavern = (playerID) => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [playerID];
    x[0]["requestClass"] = "FriendsTavernService";
    x[0]["requestMethod"] = "getOtherTavern";
    x[0]["requestId"] = FoBCore.getNextRequestID();
    
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const CollectTavern = () =>{
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [];
    x[0]["requestClass"] = "FriendsTavernService";
    x[0]["requestMethod"] = "collectReward";
    x[0]["requestId"] = FoBCore.getNextRequestID();
    
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const GetClanMemberData = () => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [];
    x[0]["requestClass"] = "OtherPlayerService";
    x[0]["requestMethod"] = "getClanMemberList";
    x[0]["requestId"] = FoBCore.getNextRequestID();
    
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const GetFriendsData = () => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [];
    x[0]["requestClass"] = "OtherPlayerService";
    x[0]["requestMethod"] = "getFriendsList";
    x[0]["requestId"] = FoBCore.getNextRequestID();
    
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const GetNeighborData = () => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [];
    x[0]["requestClass"] = "OtherPlayerService";
    x[0]["requestMethod"] = "getNeighborList";
    x[0]["requestId"] = FoBCore.getNextRequestID();
    
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const GetEntitiesData = () => {
    var x = [{}];
    x[0]["__class__"] = "ServerRequest";
    x[0]["requestData"] = [];
    x[0]["requestClass"] = "CityMapService";
    x[0]["requestMethod"] = "getEntities";
    x[0]["requestId"] = FoBCore.getNextRequestID();
    
    let sig = calcSig(x);
    return fetchData(x, sig);
}

const GetMetaDataUrls = (body) => {
    url = "";
    for (let i = 0; i < body.length; i++) {
        const resData = body[i];
        if (resData["requestClass"] === "StaticDataService" && resData["requestMethod"] === "getMetadata") {
            var meta = resData["responseData"];
            meta.forEach(obj => {
                if (obj["identifier"] === "city_entities")
                    url = obj["url"];
            });
        }
        if (url !== "")
            break;
    }
    if (url !== "")
        return fetchMetaData(url);
    else
        return null;
}

async function fetchData(x, sig) {
    let res = await fetch("https://" + WorldID + ".forgeofempires.com/game/json?h=" + User_Key, {
        "credentials": "include",
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7",
            "cache-control": "no-cache",
            "client-identification": "version=" + VersionMajorMinor + "; requiredVersion=" + VersionMajorMinor + "; platform=bro; platformType=html5; platformVersion=web",
            "content-type": "application/json",
            "pragma": "no-cache",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "signature": sig,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"
        },
        "referrer": "https://" + WorldID + ".forgeofempires.com/game/index?",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": JSON.stringify(x).replace(' ', ''),
        "method": "POST",
        "mode": "cors"
    });
    if (res.status === 200) {
        let body = await res.text();
        try {
            var json = JSON.parse(body);
            if(json[0]["__class__"] === "Error" || json[0]["__class__"] === "Redirect")
                FoBMain.SessionExpired();
            return json;
        } catch (error) {
            return JSON.parse("[]");
        }
    }
    else
        return JSON.parse("[]");
}

async function fetchMetaData(url) {
    let res = await fetch(url, {
        "credentials": "include",
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7",
            "cache-control": "no-cache",
            "content-type": "application/json",
            "pragma": "no-cache",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"
        },
        "referrer": "https://" + WorldID + ".forgeofempires.com/game/index?",
        "referrerPolicy": "no-referrer-when-downgrade",
        "method": "GET",
        "mode": "cors"
    });
    if (res.status === 200) {
        let body = await res.text();
        try {
            var json = JSON.parse(body);
            if(json[0]["__class__"] === "Error")
                throw "Error";
            return json;
        } catch (error) {
            return JSON.parse("[]");
        }
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

exports.DoCollectProduction = DoCollectProduction;
exports.DoMotivate = DoMotivate;
exports.DoLogService = DoLogService;
exports.DoCollectTavern = DoCollectTavern;
exports.DoCollectReward = DoCollectReward;
exports.DoCollectProduction = DoCollectProduction;
exports.DoQueryProduction = DoQueryProduction;
exports.DoCancelProduction = DoCancelProduction;
exports.VisitTavern = VisitTavern;

exports.GetClanMember = GetClanMember;
exports.GetFriends = GetFriends;
exports.GetNeighbor = GetNeighbor;
exports.GetLGs = GetLGs;
exports.GetEntities = GetEntities;
exports.GetStartup = GetStartup;
exports.GetMetaDataUrls = GetMetaDataUrls;