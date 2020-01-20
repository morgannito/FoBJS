const events = require('events');

var SocialDict = [];
var TavernDict = [];

function GetFriends(data){
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if(resData["requestMethod"] === "getData"){
            let socialBar = resData["responseData"]["socialbar_list"];
            for (let x = 0; x < socialBar.length; x++) {
                const player = socialBar[x];
                if(undefined !== player["id"] || null !== player["id"]){
                    SocialDict.push({
                        key: player["player_id"],
                        value:  player["name"],
                        item: player
                    });
                }
            }
        }
    }
}

function GetTavernInfo(data){
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if(resData["requestMethod"] === "getOtherTavernStates" && resData["requestClass"] === "FriendsTavernService"){
            let OtherTavern = resData["responseData"];
            for (let x = 0; x < OtherTavern.length; x++) {
                const TavernInfo = OtherTavern[x];
                if(TavernInfo["sittingPlayerCount"] !== TavernInfo["unlockedChairCount"] && TavernInfo["state"] !== "satDown" && TavernInfo["state"] !== "noChair"){
                    TavernDict.push({
                        key: TavernInfo["ownerId"],
                        value: "Free Chair"
                    });
                }
            }
        }
    }
}

exports.SocialDict = SocialDict;
exports.TavernDict = TavernDict;
exports.GetFriends = GetFriends;
exports.GetTavernInfo = GetTavernInfo;