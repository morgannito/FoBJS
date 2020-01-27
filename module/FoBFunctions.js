const FoBuilder = require("./FoBuilder");
const processer = require("./FoBProccess");
const Main = require("../main");

let FriendsList, NeighborList, ClanMemberList, TavernList = [];
let ConsoleWin = null;
let Failed = [];
let Skipped = [];
let PossibleLGs = [];
let ArcBonus = 0;
let RewardMoney = 0;

function ExecuteMoppelAll(Gwin, fList, nList, cmList) {
    FriendsList = fList;
    NeighborList = nList;
    ClanMemberList = cmList;
    ConsoleWin = Gwin;
    Failed, Skipped = [];
    RewardMoney = 0;
    MotivateNeighbors(() => {
        MotivateMember(() => {
            MotivateFriends(() => {
                if (Failed.length > 0)
                    ConsoleWin.webContents.send('print', `Failed to motivate ${Failed.length} players`);
                if (Skipped.length > 0)
                    ConsoleWin.webContents.send('print', `Skipped ${Skipped.length} players`);
                ConsoleWin.webContents.send('print', "All Player motivated! Total Reward: "+ RewardMoney);
                Main.GetData(false);
            })
        })
    })
}

function ExecuteVisitTavern(Gwin, fList) {
    FriendsList = fList;
    ConsoleWin = Gwin;
    Failed, Skipped = [];
    VisitTavern(() => {
        if (Failed.length > 0)
            ConsoleWin.webContents.send('print', `Failed to visit ${Failed.length} Taverns`);
        if (Skipped.length > 0)
            ConsoleWin.webContents.send('print', `Skipped ${Skipped.length} Taverns`);
        ConsoleWin.webContents.send('print', "All Taverns visited!");
        Main.GetData(false);
    });
}

function ExecuteSnipLGs(Gwin, fList, nList) {
    FriendsList = fList;
    NeighborList = nList;
    ConsoleWin = Gwin;
    PossibleLGs = [];
    ConsoleWin.webContents.send('print', `Do: Get possible Snip LGs`);
    GetPLGIFriends(() => {
        GetPLGINeighbor(() => {
            for (let i = 0; i < PossibleLGs.length; i++) {
                const LG = PossibleLGs[i];
                ConsoleWin.webContents.send('print', `${LG.name} (${LG.PlayerName}): ${LG.string}`);
            }
            Main.GetData(false);
        })
    })
}

function VisitTavern(callback) {
    TavernList = processer.GetVisitableTavern(FriendsList);
    ConsoleWin.webContents.send('print', `Do: Visit Friends Tavern (Count: ${TavernList.length})`);
    var i = 0;
    if (TavernList.length > 0) {
        var interval = setInterval(function () {
            if (i < TavernList.length) {
                var Friend = TavernList[i];
                FoBuilder.VisitTavern(Friend.key)
                    .then(body => {
                        if (body !== JSON.parse("[]")) {
                            var result = processer.GetTavernResult(body);
                            ConsoleWin.webContents.send('progress', `${Friend.item["name"]}: ${result["state"]} - Reward: ${processer.GetTavernReward(result)}  (${i + 1}/${TavernList.length})`);
                        } else {
                            Failed.push(Friend);
                        }
                    });
            }
            i++;
            if (i >= TavernList.length) {
                clearInterval(interval);
                ConsoleWin.webContents.send('print', `Tavernvisits done (Count: ${TavernList.length})`);
                callback();
            }
        }, 800);
    } else {
        ConsoleWin.webContents.send('print', `Tavernvisits done (Count: ${TavernList.length})`);
        callback();
    }
}
function MotivateMember(callback) {
    ConsoleWin.webContents.send('print', "Do: Motivate all Clanmember (Count: " + ClanMemberList.length + ")");
    var i = 0;
    var rewardMoney = 0;
    if (ClanMemberList.length > 0) {
        var interval = setInterval(function () {
            if (i < ClanMemberList.length) {
                var Member = ClanMemberList[i];
                if (Member.canMotivate) {
                    FoBuilder.DoMotivate(Member.key)
                        .then(body => {
                            if (body !== JSON.parse("[]")) {
                                var result = processer.GetMotivateResult(body);
                                rewardMoney += result.reward;
                                ConsoleWin.webContents.send('progress', `${Member.item["name"]}: ${result.result}  (${i + 1}/${ClanMemberList.length})`);
                            } else {
                                Failed.push(Member);
                            }
                        });
                }
                else {
                    ConsoleWin.webContents.send('progress', `Skipping ${Member.item["name"]} (${i + 1}/${ClanMemberList.length})`);
                    Skipped.push(Member);
                }
            }
            i++;
            if (i >= ClanMemberList.length) {
                clearInterval(interval);
                RewardMoney += rewardMoney;
                ConsoleWin.webContents.send('print', `ClanMember Motivation done! Total Reward: ${rewardMoney} Gold (Count: ${ClanMemberList.length})`);
                callback();
            }
        }, 800);
    }
}
function MotivateFriends(callback) {
    ConsoleWin.webContents.send('print', "Do: Motivate all Friends (Count: " + FriendsList.length + ")");
    var i = 0;
    var rewardMoney = 0;
    if (FriendsList.length > 0) {
        var interval = setInterval(function () {
            if (i < FriendsList.length) {
                var Player = FriendsList[i];
                if (Player.canMotivate) {
                    FoBuilder.DoMotivate(Player.key)
                        .then(body => {
                            if (body !== JSON.parse("[]")) {
                                var result = processer.GetMotivateResult(body);
                                rewardMoney += result.reward;
                                ConsoleWin.webContents.send('progress', `${Player.item["name"]}: ${result.result}  (${i + 1}/${FriendsList.length})`);
                            } else {
                                Failed.push(Player);
                            }
                        });
                }
                else {
                    ConsoleWin.webContents.send('progress', `Skipping ${Player.item["name"]} (${i + 1}/${FriendsList.length})`);
                    Skipped.push(Player);
                }
            }
            i++;
            if (i >= FriendsList.length) {
                clearInterval(interval);
                RewardMoney += rewardMoney;
                ConsoleWin.webContents.send('print', `Friends Motivation done! Total Reward: ${rewardMoney} Gold (Count: ${FriendsList.length})`);
                callback();
            }
        }, 800);
    }
}
function MotivateNeighbors(callback) {
    ConsoleWin.webContents.send('print', "Do: Motivate all Neighbors (Count: " + NeighborList.length + ")");
    var i = 0;
    var rewardMoney = 0;
    if (NeighborList.length > 0) {
        var interval = setInterval(function () {
            if (i < NeighborList.length) {
                var Player = NeighborList[i];
                if (Player.canMotivate) {
                    FoBuilder.DoMotivate(Player.key)
                        .then(body => {
                            if (body !== JSON.parse("[]")) {
                                var result = processer.GetMotivateResult(body);
                                rewardMoney += result.reward;
                                ConsoleWin.webContents.send('progress', `${Player.item["name"]}: ${result.result}  (${i + 1}/${NeighborList.length})`);
                            } else {
                                Failed.push(Player);
                            }
                        });
                }
                else {
                    ConsoleWin.webContents.send('progress', `Skipping ${Player.item["name"]} (${i + 1}/${NeighborList.length})`);
                    Skipped.push(Player);
                }
            }
            i++;
            if (i >= NeighborList.length) {
                clearInterval(interval);
                RewardMoney += rewardMoney;
                ConsoleWin.webContents.send('print', `Neighbors Motivation done! Total Reward: ${rewardMoney} Gold (Count: ${NeighborList.length})`);
                callback();
            }
        }, 800);
    }
}
function GetPLGIFriends(callback) {
    var i = 0;
    var LGDict = [];
    var tmp = [];
    if (FriendsList.length > 0) {
        var interval = setInterval(function () {
            if (i < FriendsList.length) {
                var Player = FriendsList[i];
                if (!Player.item["is_guild_member"] && Player.item["has_great_building"]) {
                    FoBuilder.GetLGs(Player.key)
                        .then(body => {
                            if (body !== JSON.parse("[]")) {
                                ConsoleWin.webContents.send('progress', `Searching player ${Player.item["name"]}(${i + 1}/${FriendsList.length})`);
                                tmp = processer.GetLGResult(body, ArcBonus)
                                if(tmp.length > 0){
                                    PossibleLGs.concat(tmp);
                                    LGDict.concat(tmp);
                                }
                            }
                        });
                }
            }
            i++;
            if (i >= FriendsList.length) {
                clearInterval(interval);
                ConsoleWin.webContents.send('print', `Found ${LGDict.length} LGs`);
                callback();
            }
        }, 800);
    }
}
function GetPLGINeighbor(callback) {
    var i = 0;
    var LGDict = [];
    var tmp = [];
    if (NeighborList.length > 0) {
        var interval = setInterval(function () {
            if (i < NeighborList.length) {
                var Player = NeighborList[i];
                if (!Player.item["is_guild_member"] && Player.item["has_great_building"]) {
                    FoBuilder.GetLGs(Player.key)
                        .then(body => {
                            if (body !== JSON.parse("[]")) {
                                ConsoleWin.webContents.send('progress', `Searching player ${Player.item["name"]}(${i + 1}/${NeighborList.length})`);
                                tmp = processer.GetLGResult(body, ArcBonus)
                                if(tmp.length > 0){
                                    PossibleLGs.concat(tmp);
                                    LGDict.concat(tmp);
                                }
                            }
                        });
                }
            }
            i++;
            if (i >= NeighborList.length) {
                clearInterval(interval);
                ConsoleWin.webContents.send('print', `Found ${LGDict.length} LGs`);
                callback();
            }
        }, 800);
    }
}

exports.FriendsList = FriendsList;
exports.ClanMemberList = ClanMemberList;
exports.TavernList = TavernList;
exports.NeighborList = NeighborList;
exports.PossibleLGs = PossibleLGs;
exports.ExecuteMoppelAll = ExecuteMoppelAll;
exports.ExecuteSnipLGs = ExecuteSnipLGs;
exports.ExecuteVisitTavern = ExecuteVisitTavern;
exports.ConsoleWin = ConsoleWin;
exports.ArcBonus = ArcBonus;