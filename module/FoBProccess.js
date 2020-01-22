const events = require('events');

let NeighborDict = [];
let FriendsDict = [];
let ClanMemberDict = [];

function GetNeighbor(data) {
    //NeighborDict = [];
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "OtherPlayerService" && resData["requestMethod"] === "getNeighborList") {
            let Neighbors = resData["responseData"];
            for (let x = 0; x < Neighbors.length; x++) {
                const neighbor = Neighbors[x];
                if (neighbor["is_self"] !== true) {
                    NeighborDict.push({
                        key: neighbor["player_id"],
                        canMotivate: (undefined === neighbor["next_interaction_in"] ? true : false),
                        item: neighbor
                    });
                }
            }
        }
    }
    return NeighborDict;
}

function GetFriends(data) {
    //FriendsDict = [];
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "OtherPlayerService" && resData["requestMethod"] === "getFriendsList") {
            let Friends = resData["responseData"];
            for (let x = 0; x < Friends.length; x++) {
                const friend = Friends[x];
                if (friend["is_self"] !== true) {
                    FriendsDict.push({
                        key: friend["player_id"],
                        canMotivate: (undefined === friend["next_interaction_in"] ? true : false),
                        taverninfo: [],
                        item: friend
                    });
                }
            }
        }
    }
    return FriendsDict;
}

function GetClanMember(data) {
    //ClanMemberDict = [];
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "OtherPlayerService" && resData["requestMethod"] === "getClanMemberList") {
            let ClanMember = resData["responseData"];
            for (let x = 0; x < ClanMember.length; x++) {
                const Member = ClanMember[x];
                if (Member["is_self"] !== true) {
                    ClanMemberDict.push({
                        key: Member["player_id"],
                        canMotivate: (undefined === Member["next_interaction_in"] ? true : false),
                        item: Member
                    });
                }
            }
        }
    }
    return ClanMemberDict;
}

function GetMotivateResult(data) {
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "OtherPlayerService" && resData["requestMethod"] === "polivateRandomBuilding") {
            let MotivateAction = resData["responseData"];
            return MotivateAction["action"];
        }
    }
}

function GetTavernInfo(data) {
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "FriendsTavernService" && resData["requestMethod"] === "getOtherTavernStates") {
            let TavernInfo = resData["responseData"];
            for (let x = 0; x < TavernInfo.length; x++) {
                const Tavern = TavernInfo[x];
                if (FriendsDict.length > 0) {
                    for (let i = 0; i < FriendsDict.length; i++) {
                        const friend = FriendsDict[i];
                        if (friend.key === Tavern["ownerId"])
                            friend.taverninfo = Tavern;
                    }
                }
            }
        }
    }
}

function GetTavernResult(data) {
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "FriendsTavernService" && resData["requestMethod"] === "getOtherTavern") {
            let TavernResult = resData["responseData"];
            return TavernResult;
        }
    }
}

function GetVisitableTavern(FriendsList) {
    return FriendsList.filter(friend => {
        return (undefined !== friend.taverninfo && undefined === friend.taverninfo["state"] && friend.taverninfo["sittingPlayerCount"] < friend.taverninfo["unlockedChairCount"])
    });
}
function GetTavernReward(data) {
    let result = "";
    if (data["rewardResources"].length > 0) {
        if (data["rewardResources"]["resources"].length > 0) {
            if (undefined !== data["rewardResources"]["resources"]["tavern_silver"])
                result += `${data["rewardResources"]["resources"]["tavern_silver"]} Silver `;
            if (undefined !== data["rewardResources"]["resources"]["strategy_points"])
                result += `${data["rewardResources"]["resources"]["strategy_points"]} FPs `;
        }
        else {
            return "none"
        }
    } else return "none"
    return result;
}

function clearLists() {
    NeighborDict = [];
    FriendsDict = [];
    ClanMemberDict = [];
}

exports.GetNeighbor = GetNeighbor;
exports.GetClanMember = GetClanMember;
exports.GetFriends = GetFriends;
exports.GetTavernInfo = GetTavernInfo;
exports.GetVisitableTavern = GetVisitableTavern;
exports.GetTavernReward = GetTavernReward;
exports.GetMotivateResult = GetMotivateResult;
exports.GetTavernResult = GetTavernResult;
exports.ClanMemberDict = ClanMemberDict;
exports.FriendsDict = FriendsDict;
exports.NeighborDict = NeighborDict;
exports.clearLists = clearLists;