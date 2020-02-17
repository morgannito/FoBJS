const FoBuilder = require("./FoBuilder");
const processer = require("./FoBProccess");
const FoBCore = require("./FoBCore");
const Main = require("../main");

let FriendsList, NeighborList, ClanMemberList, TavernList, HiddenRewards = [];
let ConsoleWin = null;
let Failed = [];
let Skipped = [];
let PossibleLGs = [];
let ArcBonus = 0;
let RewardMoney = 0;
var oldRewardMoney = 0;

function ExecuteMoppelAll(Gwin, fList, nList, cmList) {
    FriendsList = fList;
    NeighborList = nList;
    ClanMemberList = cmList;
    ConsoleWin = Gwin;
    Failed, Skipped = [];
    RewardMoney = 0;
    MotivateNeighbors(() => {
        ConsoleWin.webContents.send('print', `Neighbors Motivation done! Total Reward: ${RewardMoney} Gold (Count: ${NeighborList.length})`);
        oldRewardMoney = RewardMoney;
        MotivateMember(() => {
            ConsoleWin.webContents.send('print', `ClanMember Motivation done! Total Reward: ${RewardMoney - oldRewardMoney} Gold (Count: ${ClanMemberList.length})`);
            oldRewardMoney = RewardMoney;
            MotivateFriends(() => {
                ConsoleWin.webContents.send('print', `Friends Motivation done! Total Reward: ${RewardMoney - oldRewardMoney} Gold (Count: ${FriendsList.length})`);
                oldRewardMoney = 0;
                if (Failed.length > 0)
                    ConsoleWin.webContents.send('print', `Failed to motivate ${Failed.length} players`);
                if (Skipped.length > 0)
                    ConsoleWin.webContents.send('print', `Skipped ${Skipped.length} players`);
                ConsoleWin.webContents.send('print', "All Player motivated! Total Reward: " + RewardMoney);
                Main.GetData(true);
            })
        })
    })
}

function ExecuteMotivateMember(Gwin, List) {
    ClanMemberList = List;
    ConsoleWin = Gwin;
    Failed, Skipped = [];
    RewardMoney = 0;
    MotivateMember(() => {
        ConsoleWin.webContents.send('print', `ClanMember Motivation done! Total Reward: ${RewardMoney} Gold (Count: ${ClanMemberList.length})`);
        if (Failed.length > 0)
            ConsoleWin.webContents.send('print', `Failed to motivate ${Failed.length} players`);
        if (Skipped.length > 0)
            ConsoleWin.webContents.send('print', `Skipped ${Skipped.length} players`);
        Main.GetData(true);
    });
}

function ExecuteMotivateFriends(Gwin, List) {
    FriendsList = List;
    ConsoleWin = Gwin;
    Failed, Skipped = [];
    RewardMoney = 0;
    MotivateFriends(() => {
        ConsoleWin.webContents.send('print', `Friends Motivation done! Total Reward: ${RewardMoney} Gold (Count: ${FriendsList.length})`);
        if (Failed.length > 0)
            ConsoleWin.webContents.send('print', `Failed to motivate ${Failed.length} players`);
        if (Skipped.length > 0)
            ConsoleWin.webContents.send('print', `Skipped ${Skipped.length} players`);
        Main.GetData(true);
    });
}

function ExecuteMotivateNeighbors(Gwin, List) {
    NeighborList = List;
    ConsoleWin = Gwin;
    Failed, Skipped = [];
    RewardMoney = 0;
    MotivateNeighbors(() => {
        ConsoleWin.webContents.send('print', `Neighbors Motivation done! Total Reward: ${RewardMoney} Gold (Count: ${NeighborList.length})`);
        if (Failed.length > 0)
            ConsoleWin.webContents.send('print', `Failed to motivate ${Failed.length} players`);
        if (Skipped.length > 0)
            ConsoleWin.webContents.send('print', `Skipped ${Skipped.length} players`);
        Main.GetData(true);
    });
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
                ConsoleWin.webContents.send('print', `${LG.Name} (${LG.PlayerName}): ${LG.string}`);
            }
            Main.GetData(false);
        })
    })
}

function CollectTavern(Gwin) {
    if (processer.OwnTavernInfo[2] == 0) return;
    ConsoleWin = Gwin;
    ConsoleWin.webContents.send('print', `Do: Collect Tavern`);
    FoBuilder.DoCollectTavern()
        .then((data) => {
            let diff = processer.GetTavernCollectResult(data);
            ConsoleWin.webContents.send('print', `Collected ${diff} Taver Silver`);
            Main.GetData(false);
        });
}

function ExecuteCollectRewards(Gwin) {
    ConsoleWin = Gwin;

    CollectRewards(() => {
        Main.GetData(false);
    });
}
function CollectRewards(callback) {
    HiddenRewards = processer.HiddenRewards.filter((reward) => {
        if (reward.position === "cityRoadBig") {
            if (Main.HideBigRoad)
                return false;
            else
                if (reward.isVisible)
                    return true;
                else
                    return false;
        }
        if (reward.isVisible)
            return true;
        else
            return false;
    });
    var i = 0;
    var doneReward = [];
    if (HiddenRewards.length > 0) {
        var interval = setInterval(function () {
            if (!doneReward.includes(i)) {
                if (i < HiddenRewards.length) {
                    var Incident = HiddenRewards[i];
                    doneReward.push(i);
                    ConsoleWin.webContents.send('toggleOverlay', [true, `Collect Incidents... ${i+1}/${HiddenRewards.length}`]);
                    FoBuilder.DoCollectReward(Incident.id)
                        .then(body => {
                            if (body !== JSON.parse("[]")) {
                                var result = processer.GetRewardResult(body);
                                if(result !== undefined){
                                    ConsoleWin.webContents.send('toggleOverlay', [true, `Collect Incidents... ${i+1}/${HiddenRewards.length} -> Reward: ${result[0].name}`]);
                                    ConsoleWin.webContents.send('info', `Incident collected, Reward: ${result[0].name}`);
                                }
                                i++;
                                if (i >= HiddenRewards.length) {
                                    clearInterval(interval);
                                    ConsoleWin.webContents.send('print', `Incidents done (Count: ${HiddenRewards.length})`);
                                    return callback();
                                }
                            } else {
                                Failed.push(Incident);
                                i++;
                                if (i >= HiddenRewards.length) {
                                    clearInterval(interval);
                                    ConsoleWin.webContents.send('print', `Incidents done (Count: ${HiddenRewards.length})`);
                                    return callback();
                                }
                            }
                        });
                }
            }
        }, FoBCore.getRandomIntervall());
    } else {
        ConsoleWin.webContents.send('print', `Incidents 2 done (Count: ${HiddenRewards.length})`);
        return callback();
    }
}
function VisitTavern(callback) {
    TavernList = processer.GetVisitableTavern(FriendsList);
    ConsoleWin.webContents.send('toggleOverlay', [true, `Visiting Friendstavern...`]);
    ConsoleWin.webContents.send('print', `Do: Visit Friends Tavern (Count: ${TavernList.length})`);
    var i = 0;
    var doneTavern = [];
    var RewardTavern = { Silver: 0, FP: 0 };
    if (TavernList.length > 0) {
        var interval = setInterval(function () {
            if (!doneTavern.includes(i)) {
                if (i < TavernList.length) {
                    var Friend = TavernList[i];
                    doneTavern.push(i);
                    ConsoleWin.webContents.send('toggleOverlay', [true, `Visiting Friendstavern... ${i + 1}/${TavernList.length}`]);
                    FoBuilder.VisitTavern(Friend.key)
                        .then(body => {
                            if (body !== JSON.parse("[]")) {
                                var result = processer.GetTavernResult(body);
                                ConsoleWin.webContents.send('progress', `${Friend.item["name"]}: ${result["state"]} (${i + 1}/${TavernList.length})`);
                                RewardTavern = processer.GetTavernReward(result,RewardTavern);
                                i++;
                                if (i >= TavernList.length) {
                                    clearInterval(interval);
                                    ConsoleWin.webContents.send('print', `Tavernvisits done (Count: ${TavernList.length}) Reward: ${RewardTavern.Silver} Silver & ${RewardTavern.FP} FPs`);
                                    callback();
                                }
                            } else {
                                Failed.push(Friend);
                                i++;
                                if (i >= TavernList.length) {
                                    clearInterval(interval);
                                    ConsoleWin.webContents.send('print', `Tavernvisits done (Count: ${TavernList.length})`);
                                    callback();
                                }
                            }
                        });
                }
            }
        }, FoBCore.getRandomIntervall());
    } else {
        ConsoleWin.webContents.send('print', `Tavernvisits done (Count: ${TavernList.length})`);
        callback();
    }
}
function MotivateMember(callback) {
    ConsoleWin.webContents.send('toggleOverlay', [true, "Motivating Clanmembers..."]);
    ConsoleWin.webContents.send('print', "Do: Motivate all Clanmember (Count: " + ClanMemberList.length + ")");
    var i = 0;
    var rewardMoney = 0;
    var doneMotivate = [];
    if (ClanMemberList.length > 0) {
        var interval = setInterval(function () {
            if (!doneMotivate.includes(i)) {
                if (i < ClanMemberList.length) {
                    doneMotivate.push(i);
                    var Member = ClanMemberList[i];
                    if (Member.canMotivate) {
                        ConsoleWin.webContents.send('toggleOverlay', [true, `Motivating Clanmembers... ${i+1}/${ClanMemberList.length}`]);
                        FoBuilder.DoMotivate(Member.key)
                            .then(body => {
                                if (body !== JSON.parse("[]")) {
                                    var result = processer.GetMotivateResult(body);
                                    rewardMoney += result.reward;
                                    ConsoleWin.webContents.send('progress', `${Member.item["name"]}: ${result.result}  (${i + 1}/${ClanMemberList.length})`);
                                    i++;
                                    if (i >= ClanMemberList.length) {
                                        clearInterval(interval);
                                        RewardMoney += rewardMoney;
                                        callback();
                                    }
                                } else {
                                    Failed.push(Member);
                                }
                            });
                    }
                    else {
                        ConsoleWin.webContents.send('progress', `Skipping ${Member.item["name"]} (${i}/${ClanMemberList.length})`);
                        Skipped.push(Member);
                        i++;
                        if (i >= ClanMemberList.length) {
                            clearInterval(interval);
                            RewardMoney += rewardMoney;
                            callback();
                        }
                    }
                }
            }
        }, FoBCore.getRandomIntervall());
    }
    else {
        callback();
    }
}
function MotivateFriends(callback) {
    ConsoleWin.webContents.send('toggleOverlay', [true, "Motivating Friends..."]);
    ConsoleWin.webContents.send('print', "Do: Motivate all Friends (Count: " + FriendsList.length + ")");
    var i = 0;
    var rewardMoney = 0;
    var doneMotivate = [];
    if (FriendsList.length > 0) {
        var interval = setInterval(function () {
            if (!doneMotivate.includes(i)) {
                if (i < FriendsList.length) {
                    var Player = FriendsList[i];
                    doneMotivate.push(i);
                    if (Player.canMotivate) {
                        ConsoleWin.webContents.send('toggleOverlay', [true, `Motivating Friends... ${i+1}/${FriendsList.length}`]);
                        FoBuilder.DoMotivate(Player.key)
                            .then(body => {
                                if (body !== JSON.parse("[]")) {
                                    var result = processer.GetMotivateResult(body);
                                    rewardMoney += result.reward;
                                    ConsoleWin.webContents.send('progress', `${Player.item["name"]}: ${result.result}  (${i + 1}/${FriendsList.length})`);
                                    i++;
                                    if (i >= FriendsList.length) {
                                        clearInterval(interval);
                                        RewardMoney += rewardMoney;
                                        callback();
                                    }
                                } else {
                                    Failed.push(Player);
                                }
                            });
                    }
                    else {
                        ConsoleWin.webContents.send('progress', `Skipping ${Player.item["name"]} (${i}/${FriendsList.length})`);
                        Skipped.push(Player);
                        i++;
                        if (i >= FriendsList.length) {
                            clearInterval(interval);
                            RewardMoney += rewardMoney;
                            callback();
                        }
                    }
                }
            }
        }, FoBCore.getRandomIntervall());
    }
    else {
        callback();
    }
}
function MotivateNeighbors(callback) {
    ConsoleWin.webContents.send('toggleOverlay', [true, "Motivating Neighbors..."]);
    ConsoleWin.webContents.send('print', "Do: Motivate all Neighbors (Count: " + NeighborList.length + ")");
    var i = 0;
    var rewardMoney = 0;
    var doneMotivate = [];
    if (NeighborList.length > 0) {
        var interval = setInterval(function () {
            if (!doneMotivate.includes(i)) {
                if (i < NeighborList.length) {
                    var Player = NeighborList[i];
                    doneMotivate.push(i);
                    if (Player.canMotivate) {
                        ConsoleWin.webContents.send('toggleOverlay', [true, `Motivating Neighbors... ${i+1}/${NeighborList.length}`]);
                        FoBuilder.DoMotivate(Player.key)
                            .then(body => {
                                if (body !== JSON.parse("[]")) {
                                    var result = processer.GetMotivateResult(body);
                                    rewardMoney += result.reward;
                                    ConsoleWin.webContents.send('progress', `${Player.item["name"]}: ${result.result}  (${i + 1}/${NeighborList.length})`);
                                    i++;
                                    if (i >= NeighborList.length) {
                                        clearInterval(interval);
                                        RewardMoney += rewardMoney;
                                        callback();
                                    }
                                } else {
                                    Failed.push(Player);
                                }
                            });
                    }
                    else {
                        ConsoleWin.webContents.send('progress', `Skipping ${Player.item["name"]} (${i}/${NeighborList.length})`);
                        Skipped.push(Player);
                        i++;
                        if (i >= NeighborList.length) {
                            clearInterval(interval);
                            RewardMoney += rewardMoney;
                            callback();
                        }
                    }
                }
            }
        }, FoBCore.getRandomIntervall());
    }
    else {
        callback();
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
                                if (tmp.length > 0) {
                                    PossibleLGs = PossibleLGs.concat(tmp);
                                    LGDict = LGDict.concat(tmp);
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
        }, FoBCore.getRandomIntervall());
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
                                if (tmp.length > 0) {
                                    PossibleLGs = PossibleLGs.concat(tmp);
                                    LGDict = LGDict.concat(tmp);
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
        }, FoBCore.getRandomIntervall());
    }
}

async function CheckUpdate(curVer){
    var newVer = await FoBuilder.fetchUpdate();
    newVer = newVer.replace(/\n/g,"");
    let newVerArr = newVer.split(".");
    let curVerArr = curVer.split(".");
    if (parseInt(curVerArr[0]) < parseInt(newVerArr[0]))
        return { hasUpdate: true, newVersion: newVer };
    else if (parseInt(curVerArr[1]) < parseInt(newVerArr[1]))
        return { hasUpdate: true, newVersion: newVer };
    else if (parseInt(curVerArr[2]) < parseInt(newVerArr[2]))
        return { hasUpdate: true, newVersion: newVer };
    else
        return { hasUpdate: false, newVersion: curVer };
}


function Test() {
    FoBuilder.DoQueryProduction(35, 1)
        .then(data => {
            console.log(data);
            //ipcRenderer.send('ChangeState', { Unit: prodUnit["id"], OldState: eState.Idle });
        })
}

exports.FriendsList = FriendsList;
exports.ClanMemberList = ClanMemberList;
exports.TavernList = TavernList;
exports.NeighborList = NeighborList;
exports.PossibleLGs = PossibleLGs;
exports.ConsoleWin = ConsoleWin;
exports.ArcBonus = ArcBonus;

exports.ExecuteMoppelAll = ExecuteMoppelAll;
exports.ExecuteMotivateFriends = ExecuteMotivateFriends;
exports.ExecuteMotivateMember = ExecuteMotivateMember;
exports.ExecuteMotivateNeighbors = ExecuteMotivateNeighbors;
exports.ExecuteCollectRewards = ExecuteCollectRewards;
exports.ExecuteSnipLGs = ExecuteSnipLGs;
exports.CollectTavern = CollectTavern;
exports.ExecuteVisitTavern = ExecuteVisitTavern;

exports.CheckUpdate = CheckUpdate;

exports.Test = Test;