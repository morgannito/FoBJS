const FoBCore = require("./FoBCore");

let NeighborDict = [];
let FriendsDict = [];
let ClanMemberDict = [];
var ResourceDict = [];
var OwnTavernInfo = {};
var OwnTavernData = [];
var LimitedBonuses = [];
var HiddenRewards = [];
var ResourceDefinitions = [];
var ProductionDict = [];
var GoodProdDict = [];
var AllBuildings = [];
var ResidentialDict = [];
var DProductionDict = [];
var DGoodProductionDict = [];
var DResidentialDict = [];
var BuildingsDict = [];
var AllBoosts = {
    'happiness_amount': 0,
    'coin_production': 0,
    'supply_production': 0
};
var Boosts = [];
var GoodsDict = [];

var oldTavernSilver = null;
var newTavernSilver = null;

function GetNeighbor(data) {
    NeighborDict = [];
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
    exports.NeighborDict = NeighborDict;
    return NeighborDict;
}
function GetFriends(data) {
    FriendsDict = [];
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "OtherPlayerService" && resData["requestMethod"] === "getFriendsList") {
            let Friends = resData["responseData"];
            for (let x = 0; x < Friends.length; x++) {
                const friend = Friends[x];
                if (friend["is_self"] !== true && friend["is_friend"]) {
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
    exports.FriendsDict = FriendsDict;
    return FriendsDict;
}
function GetClanMember(data) {
    ClanMemberDict = [];
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
    exports.ClanMemberDict = ClanMemberDict;
    return ClanMemberDict;
}
function GetMotivateResult(data) {
    var reward = 0;
    var result = "";
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "OtherPlayerService" && resData["requestMethod"] === "rewardResources") {
            let rew = resData["responseData"]["resources"];
            reward = rew['money'];
        }
        if (resData["requestClass"] === "OtherPlayerService" && resData["requestMethod"] === "polivateRandomBuilding") {
            if (resData["responseData"]["__class__"] === "Error")
                result = "failed";
            else
                result = resData["responseData"]["action"];
        }
    }
    return { result: result, reward: reward };
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
function GetOwnTavernData(data) {
    OwnTavernData = [];
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "FriendsTavernService" && resData["requestMethod"] === "getOwnTavern") {
            OwnTavernData = resData["responseData"];
        }
    }
    exports.OwnTavernData = OwnTavernData;
}
function GetTavernCollectResult(data) {
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "FriendsTavernService" && resData["requestMethod"] === "collectReward") {
            if ((oldTavernSilver !== undefined && oldTavernSilver !== null) && (newTavernSilver !== undefined && newTavernSilver !== null)) {
                if (oldTavernSilver < newTavernSilver) {
                    return (newTavernSilver - oldTavernSilver)
                } else {
                    return 0;
                }
            }
        }
        if (resData["requestClass"] === "ResourceService" && resData["requestMethod"] === "getPlayerResources") {
            oldTavernSilver = ResourceDict["tavern_silver"];
            GetResources(data);
        }
    }
}
function GetRewardResult(data) {
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "RewardService" && resData["requestMethod"] === "collectReward") {
            let RewardResults = resData["responseData"];
            var Result = [];
            for (let i = 0; i < RewardResults.length; i++) {
                if (RewardResults[i] === "default") continue;
                const RewardResult = RewardResults[i][i];
                Result.push({
                    type: RewardResult["subType"],
                    amount: RewardResult["amount"],
                    name: RewardResult["name"]
                })
            }
            return Result;
        }
        if (resData["requestClass"] === "ResourceService" && resData["requestMethod"] === "getPlayerResources") {
            GetResources(data);
        }
        if (resData["requestClass"] === "HiddenRewardService" && resData["requestMethod"] === "getOverview") {
            GetHiddenRewards(data);
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
function GetResources(data) {
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "ResourceService" && resData["requestMethod"] === "getPlayerResources") {
            ResourceDict = resData["responseData"]["resources"];
        }
    }
    newTavernSilver = ResourceDict["tavern_silver"];
    exports.ResourceDict = ResourceDict;
}
function GetResourceDefinitions(data) {
    ResourceDefinitions = [];
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "ResourceService" && resData["requestMethod"] === "getResourceDefinitions") {
            let res = resData["responseData"];
            for (let i = 0; i < res.length; i++) {
                const Definition = res[i];
                if (Definition["id"] === "premium" || Definition["id"] === "money"|| Definition["id"] === "strategy_points" || Definition["id"] === "supplies" || Definition["id"] === "tavern_silver" || Definition["id"] === "medals") {
                    ResourceDefinitions.push(Definition)
                }
                else if (Definition["abilities"] !== undefined) {
                    if (Definition["abilities"]["goodsProduceable"] !== undefined)
                        ResourceDefinitions.push(Definition)
                    else if (Definition["abilities"]["specialResource"] !== undefined)
                        ResourceDefinitions.push(Definition)
                }
            }
        }
    }
    exports.ResourceDefinitions = ResourceDefinitions;
}
function GetHiddenRewards(data) {
    HiddenRewards = [];
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "HiddenRewardService" && resData["requestMethod"] === "getOverview") {
            var _hiddenrewards = resData["responseData"]["hiddenRewards"];
            for (let x = 0; x < _hiddenrewards.length; x++) {
                const _reward = _hiddenrewards[x];
                let startTime = _reward["startTime"];
                let endTime = _reward["expireTime"];
                var reward = {
                    id: _reward["hiddenRewardId"],
                    isVisible: ((endTime > new Date().getTime() / 1000) && (startTime < new Date().getTime() / 1000)),
                    rarity: _reward["rarity"],
                    position: _reward["position"]["context"]
                }
                HiddenRewards.push(reward);
            }
        }
    }
    exports.HiddenRewards = HiddenRewards;
}
function GetBonuses(data) {
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "BonusService" && resData["requestMethod"] === "getLimitedBonuses") {
            LimitedBonuses = resData["responseData"];
        }
    }
    exports.LimitedBonuses = LimitedBonuses;
}
function GetOwnTavernInfo(data) {
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "FriendsTavernService" && resData["requestMethod"] === "getSittingPlayersCount") {
            OwnTavernInfo = resData["responseData"];
        }
    }
    exports.OwnTavernInfo = OwnTavernInfo;
}
function GetVisitableTavern(FriendsList) {
    return FriendsList.filter(friend => {
        return (undefined !== friend.taverninfo && undefined === friend.taverninfo["state"] && friend.taverninfo["sittingPlayerCount"] < friend.taverninfo["unlockedChairCount"])
    });
}
function GetTavernReward(data, RewardTavern) {
    if (typeof (data["rewardResources"]["resources"]) === "object") {
        if (undefined !== data["rewardResources"]["resources"]["tavern_silver"])
            RewardTavern.Silver += data["rewardResources"]["resources"]["tavern_silver"];
        if (undefined !== data["rewardResources"]["resources"]["strategy_points"])
            RewardTavern.FP += data["rewardResources"]["resources"]["strategy_points"];
    }
    else {
        return RewardTavern;
    }
    return RewardTavern;
}
function GetUserData(data) {
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "StartupService" && resData["requestMethod"] === "getData") {
            for (const key in resData["responseData"]) {
                if (resData["responseData"].hasOwnProperty(key)) {
                    const item = resData["responseData"][key];
                    if (item["__class__"] === "CityUserData") {
                        return { UserID: item.player_id, UserName: item.user_name };
                    }
                }
            }
        }
    }
    exports.OwnTavernInfo = OwnTavernInfo;
}
function GetLGResult(data, ArcBonus) {
    let PossibleLGDict = [];
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "GreatBuildingsService" && resData["requestMethod"] === "getOtherPlayerOverview") {
            let LGData = resData["responseData"];
            let _PlayerName = LGData[0]["player"]["name"];
            let _PlayerID = LGData[0]["player"]["player_id"];
            for (let x = 0; x < LGData.length; x++) {
                const LG = LGData[x];
                let EntityID = LG["entity_id"],
                    CityEntityID = LG["city_entity_id"],
                    Name = LG["name"],
                    Level = LG["level"],
                    CurrentProgress = LG["current_progress"],
                    MaxProgress = LG["max_progress"],
                    Rank = LG["rank"];

                let Gewinn = undefined;
                let UnderScorePos = CityEntityID.indexOf('_');
                let AgeString = CityEntityID.substring(UnderScorePos + 1);
                UnderScorePos = AgeString.indexOf('_');
                AgeString = AgeString.substring(0, UnderScorePos);
                if (CurrentProgress === undefined)
                    CurrentProgress = 0;
                let P1 = FoBCore.GetP1(AgeString, Level);
                ArcBonus = (ArcBonus === 0 ? 1 : ArcBonus);
                if (Rank === undefined && P1 * ArcBonus >= (MaxProgress - CurrentProgress) / 2) {
                    if (Gewinn === undefined || Gewinn >= 0) {
                        let GewinnString = undefined,
                            KursString = "";

                        if (CurrentProgress === 0) {
                            GewinnString = Math.round(P1 * arc) - Math.ceil((MaxProgress - CurrentProgress) / 2);
                            KursString = FormatKurs(Math.round(MaxProgress / P1 / 2 * 1000) / 10);
                        }
                        else if (Gewinn === undefined) {
                            GewinnString = '???';
                            KursString = '???%';
                        }
                        else {
                            GewinnString = Gewinn;
                        }
                        PossibleLGDict.push({
                            PlayerID: _PlayerID,
                            PlayerName: _PlayerName,
                            EntityID: EntityID,
                            Name: Name,
                            Level: Level,
                            string: GewinnString,
                            short: KursString,
                            LG: LG,
                        });
                    }
                }
            }
        }
    }
    return PossibleLGDict;
}
function GetArcBonus(data) {
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "BonusService" && resData["requestMethod"] === "getLimitedBonuses") {
            let x = resData["responseData"];
            let ArcBonus = 0;
            for (let j in x) {
                if (x[j].type === 'contribution_boost') {
                    ArcBonus += x[j].value;
                }
            }
            return ArcBonus;
        }
    }
}
function FormatKurs(Kurs) {
    if (Kurs === 0)
        return '-';
    else
        return Kurs + '%';
}
function GetBuildings(data) {
    for (let i = 0; i < data.length; i++) {
        const resData = data[i];
        if (resData["requestClass"] === "StartupService" && resData["requestMethod"] === "getData") {
            for (const key in resData["responseData"]) {
                if (resData["responseData"].hasOwnProperty(key)) {
                    const item = resData["responseData"][key];
                    if (item["__class__"] === "CityMap") {
                        BuildingsDict = item["entities"];
                    }
                }
            }
        }
    }
    exports.BuildingsDict = BuildingsDict;
}
function GetHappinesBoost() {
    let d = BuildingsDict;
    var BuildingsAll = [];
    let PopulationSum = 0,
        HappinessSum = 0;

    for (let i in d) {
        if (d.hasOwnProperty(i) && d[i]['id'] < 2000000000) {
            let building = readType(d[i]);
            if (building !== false) {
                BuildingsAll.push(building);
                if (building['products']['population'] !== undefined) {
                    PopulationSum += building['products']['population'];
                }
                if (building['products']['happiness'] !== undefined) {
                    HappinessSum += building['products']['happiness'];
                }
            }
        }
    }

    let HappinessBonus = AllBoosts['happiness_amount'];
    if (HappinessBonus !== undefined && HappinessBonus !== 0) {
        let building = {
            name: 'Adjacent buildings',
            type: 'boost',
            products: [],
            motivatedproducts: [],
            at: (new Date().getTime()) / 1000,
            in: 0
        }
        building.products['happiness'] = HappinessBonus;
        building.motivatedproducts['happiness'] = HappinessBonus;

        HappinessSum += HappinessBonus;
        BuildingsAll.push(building);
    }

    let ProdBonus = 0;
    if (HappinessSum < PopulationSum) {
        ProdBonus = 0.5;
    }
    else if (HappinessSum < 1.4 * PopulationSum) {
        ProdBonus = 1;
    }
    else {
        ProdBonus = 1.2;
    }

    Boosts['money'] = ProdBonus;
    Boosts['supplies'] = ProdBonus;

    exports.Boosts = Boosts;
}
function GetAllBuildings(metaCity) {
    var j = metaCity;
    BuildingNamesi18n = {};
    for (const i in j) {
        if (j.hasOwnProperty(i)) {
            BuildingNamesi18n[j[i]['asset_id']] = {
                id: j[i]['id'],
                name: j[i]['name'],
                width: j[i]['width'],
                height: j[i]['length'],
                type: j[i]['type'],
                provided_happiness: j[i]['provided_happiness'],
                population: undefined,
                entity_levels: j[i]['entity_levels'],
                available_products: j[i]['available_products'],
            };

            if (j[i]['abilities'] !== undefined) {
                for (let x in j[i]['abilities']) {
                    if (j[i]['abilities'].hasOwnProperty(x)) {
                        let ar = j[i]['abilities'][x];

                        if (ar['additionalResources'] !== undefined && ar['additionalResources']['AllAge'] !== undefined && ar['additionalResources']['AllAge']['resources'] !== undefined) {
                            BuildingNamesi18n[j[i]['asset_id']]['additionalResources'] = ar['additionalResources']['AllAge']['resources'];
                        }
                    }
                }
            }

            if (j[i]['staticResources'] !== undefined && j[i]['staticResources']['resources'] !== undefined) {
                BuildingNamesi18n[j[i]['asset_id']]['population'] = j[i]['staticResources']['resources']['population'];
            }
        }
    }
    AllBuildings = BuildingNamesi18n;
    exports.AllBuildings = AllBuildings;
}
function GetOwnBuildings() {
    ResidentialDict = [];
    ProductionDict = [];
    GoodProdDict = [];
    AllOtherDict = [];
    var city = BuildingsDict;
    var meta = AllBuildings;
    for (let ci = 0; ci < city.length; ci++) {
        const cb = city[ci];
        for (const b in meta) {
            if (meta.hasOwnProperty(b)) {
                const mb = meta[b];
                if (cb["cityentity_id"] === mb["id"]) {
                    cb["name"] = mb.name;
                    cb["available_products"] = mb["available_products"];
                    cb["type"] = mb["type"];
                    if (cb.type === 'production' && cb['connected'] && FoBCore.hasOnlySupplyProduction(cb["available_products"]))
                        ProductionDict.push(cb);
                    else if (cb.type === 'residential' && cb['connected'])
                        ResidentialDict.push(cb);
                    else if (cb.type === 'goods' && cb['connected'])
                        GoodProdDict.push(cb);
                    else if (cb.type !== 'culture' && cb.type !== 'decoration' && cb.type !== 'street' && cb.type !== 'tower'&& cb.type !== 'military'&& cb['connected']) {
                        AllOtherDict.push(cb);
                    }
                }
            }
        }
    }
    BuildingsDict = city;

    exports.ProductionDict = ProductionDict;
    exports.GoodProdDict = GoodProdDict;
    exports.ResidentialDict = ResidentialDict;
    exports.BuildingsDict = BuildingsDict;
    exports.AllOtherDict = AllOtherDict;
}
function GetBoosts() {
    var d = BuildingsDict;

    var BoostMapper = {
        'supplies_boost': 'supply_production',
        'happiness': 'happiness_amount',
        'military_boost': 'att_boost_attacker',
        'money_boost': 'coin_production'
    };
    for (let i in d) {
        if (d.hasOwnProperty(i)) {
            if (d[i]['type'] === 'greatbuilding') {
                if (d[i]['bonus'] !== undefined && BoostMapper[d[i]['bonus']['type']] !== undefined) {
                    if (d[i]['bonus']['type'] !== 'happiness') {
                        AllBoosts[BoostMapper[d[i]['bonus']['type']]] += d[i]['bonus']['value']
                    }
                }
            }
        }
    }
    exports.AllBoosts = AllBoosts;
}
function GetDistinctProductList(Grouped) {
    DResidentialDict = [];
    DProductionDict = [];
    DGoodProductionDict = [];
    DAllOtherDict = [];
    var add = true;
    for (let i = 0; i < ProductionDict.length; i++) {
        const prod = ProductionDict[i];
        if (DProductionDict.length === 0) { DProductionDict.push({ count: 1, prod: prod }); continue; }
        for (let j = 0; j < DProductionDict.length; j++) {
            const dProd = DProductionDict[j];
            if (prod["state"]["__class__"] === "ProducingState") {
                if (prod["cityentity_id"] === dProd.prod["cityentity_id"] && Grouped) {
                    var range = { min: dProd.prod.state["next_state_transition_at"] - 5, max: dProd.prod.state["next_state_transition_at"] + 5 };
                    if (range.min < prod.state["next_state_transition_at"] < range.max) {
                        if (dProd.prod.state["next_state_transition_at"] < prod.state["next_state_transition_at"])
                            dProd.prod.state["next_state_transition_at"] = prod.state["next_state_transition_at"];
                        dProd.count += 1;
                        add = false;
                    }
                }
                if (add) add = true;
            } else {
                if (prod["cityentity_id"] === dProd.prod["cityentity_id"] && Grouped) {
                    dProd.count += 1;
                    add = false;
                }
                if (add) add = true;
            }
        }
        if (add)
            DProductionDict.push({ count: 1, prod: prod });
        add = true;
    }
    DProductionDict.sort(function(a, b){
        if(a.prod["cityentity_id"] < b.prod["cityentity_id"]) { return -1; }
        if(a.prod["cityentity_id"] > b.prod["cityentity_id"]) { return 1; }
        return 0;
    })
    add = true;
    for (let i = 0; i < AllOtherDict.length; i++) {
        const prod = AllOtherDict[i];
        if (DAllOtherDict.length === 0) { DAllOtherDict.push({ count: 1, prod: prod }); continue; }
        for (let j = 0; j < DAllOtherDict.length; j++) {
            const dAllOther = DAllOtherDict[j];
            if (prod["state"]["__class__"] === "ProducingState") {
                if (prod["cityentity_id"] === dAllOther.prod["cityentity_id"]) {
                    var range = { min: dAllOther.prod.state["next_state_transition_at"] - 5, max: dAllOther.prod.state["next_state_transition_at"] + 5 };
                    if (range.min < prod.state["next_state_transition_at"] < range.max) {
                        if (dAllOther.prod.state["next_state_transition_at"] < prod.state["next_state_transition_at"])
                            dAllOther.prod.state["next_state_transition_at"] = prod.state["next_state_transition_at"];
                        dAllOther.count += 1;
                        add = false;
                    }
                }
                if (add) add = true;
            } else {
                if (prod["cityentity_id"] === dAllOther.prod["cityentity_id"]) {
                    dAllOther.count += 1;
                    add = false;
                }
                if (add) add = true;
            }
        }
        if (add)
            DAllOtherDict.push({ count: 1, prod: prod });
        add = true;
    }
    add = true;
    for (let i = 0; i < GoodProdDict.length; i++) {
        const goodProd = GoodProdDict[i];
        if (DGoodProductionDict.length === 0) { DGoodProductionDict.push({ count: 1, prod: goodProd }); continue; }
        for (let j = 0; j < DGoodProductionDict.length; j++) {
            const dGoodProd = DGoodProductionDict[j];
            if (goodProd["state"]["__class__"] === "ProducingState") {
                if (goodProd["cityentity_id"] === dGoodProd.prod["cityentity_id"] && Grouped) {
                    var range = { min: dGoodProd.prod.state["next_state_transition_at"] - 5, max: dGoodProd.prod.state["next_state_transition_at"] + 5 };
                    if (range.min < goodProd.state["next_state_transition_at"] < range.max) {
                        if (dGoodProd.prod.state["next_state_transition_at"] < goodProd.state["next_state_transition_at"])
                            dGoodProd.prod.state["next_state_transition_at"] = goodProd.state["next_state_transition_at"];
                        dGoodProd.count += 1;
                        add = false;
                    }
                }
                if (add) add = true;
            } else {
                if (goodProd["cityentity_id"] === dGoodProd.prod["cityentity_id"]&& Grouped) {
                    dGoodProd.count += 1;
                    add = false;
                }
                if (add) add = true;
            }
        }
        if (add)
            DGoodProductionDict.push({ count: 1, prod: goodProd });
        add = true;
    }
    DGoodProductionDict.sort(function(a, b){
        if(a.prod["cityentity_id"] < b.prod["cityentity_id"]) { return -1; }
        if(a.prod["cityentity_id"] > b.prod["cityentity_id"]) { return 1; }
        return 0;
    })
    add = true;
    for (let i = 0; i < ResidentialDict.length; i++) {
        const res = ResidentialDict[i];
        if (DResidentialDict.length === 0) { DResidentialDict.push({ count: 1, res: res }); continue; }
        for (let j = 0; j < DResidentialDict.length; j++) {
            const dRes = DResidentialDict[j];
            if (res["state"]["__class__"] === "ProducingState") {
                if (res["cityentity_id"] === dRes.res["cityentity_id"]) {
                    var range = { min: dRes.res.state["next_state_transition_in"] - 5, max: dRes.res.state["next_state_transition_in"] + 5 };
                    if (range.min < res.state["next_state_transition_at"] < range.max) {
                        if (dRes.res.state["next_state_transition_at"] < res.state["next_state_transition_at"])
                            dRes.res.state["next_state_transition_at"] = res.state["next_state_transition_at"];
                        dRes.count += 1;
                        add = false;
                    }
                }
                if (add) add = true;
            } else {
                if (res["cityentity_id"] === dRes.res["cityentity_id"]) {
                    dRes.count += 1;
                    add = false;
                }
                if (add) add = true;
            }
        }
        if (add)
            DResidentialDict.push({ count: 1, res: res });
        add = true;
    }
    exports.DResidentialDict = DResidentialDict;
    exports.DGoodProductionDict = DGoodProductionDict;
    exports.DProductionDict = DProductionDict;
    exports.DAllOtherDict = DAllOtherDict;
}
function SetGoodsDict(dict) {
    GoodsDict = dict;
    exports.GoodsDict = GoodsDict;
}

function readType(d) {
    let Products = [],
        CurrentResources = undefined,
        EntityID = d['cityentity_id'];

    let BuildingData = AllBuildings[EntityID];

    let AdditionalResources = BuildingData['additionalResources'];

    let Ret = {
        name: BuildingData['name'],
        id: d['id'],
        eid: d['cityentity_id'],
        type: d['type'],
        at: (new Date().getTime()) / 1000,
        in: 0
    }

    if (d.state !== undefined && d.state.current_product !== undefined && d.state.current_product.product !== undefined) {
        if (d.state.current_product.product.resources !== undefined) {
            CurrentResources = d['state']['current_product']['product']['resources'];
        }
    }

    for (let Resource in CurrentResources) {

        if (!CurrentResources.hasOwnProperty(Resource)) {
            break;
        }

        Products[Resource] = CurrentResources[Resource];
    }

    if (d['bonus'] !== undefined) {
        if (d['bonus']['type'] === 'population') {
            Products['population'] = (Products['population'] !== undefined ? Products['population'] : 0) + d['bonus']['value'];
        }
        else if (d['bonus']['type'] === 'happiness') {
            Products['happiness'] = (Products['happiness'] !== undefined ? Products['happiness'] : 0) + d['bonus']['value'];
        }
    }

    if (d['state'] !== undefined && d['state']['__class__'] !== 'ConstructionState' && d['state']['__class__'] !== 'UnconnectedState') {
        if (BuildingData['population'] !== undefined) {
            Products['population'] = (Products['population'] !== undefined ? Products['population'] : 0) + BuildingData['population'];
        }
        if (BuildingData['provided_happiness'] !== undefined) {
            let Faktor = 1;
            if (d['state']['__class__'] === 'PolishedState') {
                Faktor = 2;
            }
            Products['happiness'] = BuildingData['provided_happiness'] * Faktor;
        }
    }

    if (BuildingData['entity_levels'] !== undefined && BuildingData['entity_levels'][d['level']] !== undefined) {
        let EntityLevel = BuildingData['entity_levels'][d['level']];
        if (EntityLevel['provided_population'] !== undefined) {
            Products['population'] = (Products['population'] !== undefined ? Products['population'] : 0) + EntityLevel['provided_population'];
        }
        if (EntityLevel['provided_happiness'] !== undefined) {
            let Faktor = 1;
            if (d['state']['__class__'] === 'PolishedState') {
                Faktor = 2;
            }
            Products['happiness'] = (Products['happiness'] !== undefined ? Products['happiness'] : 0) + EntityLevel['provided_happiness'] * Faktor;
        }
    }

    let AdditionalProduct,
        MotivatedProducts = [];

    for (let ProductName in Products) {
        MotivatedProducts[ProductName] = Products[ProductName];
    }

    for (let Resource in AdditionalResources) {

        if (!AdditionalResources.hasOwnProperty(Resource)) {
            break;
        }

        if (Resource.startsWith('random_good') || Resource.startsWith('all_goods')) continue;

        AdditionalProduct = AdditionalResources[Resource];

        if (AdditionalProduct > 0) {
            if (Products[Resource] === undefined) {
                Products[Resource] = 0;
                MotivatedProducts[Resource] = AdditionalProduct;
            }
            else if (Products[Resource] < AdditionalProduct) {
                MotivatedProducts[Resource] += AdditionalProduct;
            }
        }
    }

    if (d['state'] !== undefined) {
        let At = d['state']['next_state_transition_at'],
            In = d['state']['next_state_transition_in'];

        if (At !== undefined) Ret.at = At;
        if (In !== undefined) Ret.in = In;
    }

    Ret.products = Products;
    Ret.motivatedproducts = MotivatedProducts;

    if (Object.keys(Ret.motivatedproducts).length > 0) {
        return Ret;
    }
    else {
        return false;
    }
}
function clearLists() {
    NeighborDict = [];
    FriendsDict = [];
    ClanMemberDict = [];
}

exports.AllBuildings = AllBuildings;
exports.OwnTavernData = OwnTavernData;
exports.BuildingsDict = BuildingsDict;
exports.ResidentialDict = ResidentialDict;
exports.ProductionDict = ProductionDict;
exports.GoodProdDict = GoodProdDict;
exports.DResidentialDict = DResidentialDict;
exports.DProductionDict = DProductionDict;
exports.GoodsDict = GoodsDict;
exports.SetGoodsDict = SetGoodsDict;

exports.GetDistinctProductList = GetDistinctProductList;
exports.GetHappinesBoost = GetHappinesBoost;
exports.GetOwnBuildings = GetOwnBuildings;
exports.GetAllBuildings = GetAllBuildings;
exports.GetRewardResult = GetRewardResult;
exports.GetBoosts = GetBoosts;
exports.GetBuildings = GetBuildings;
exports.GetUserData = GetUserData;
exports.GetHiddenRewards = GetHiddenRewards;
exports.GetResourceDefinitions = GetResourceDefinitions;
exports.GetBonuses = GetBonuses;
exports.GetOwnTavernInfo = GetOwnTavernInfo;
exports.GetOwnTavernData = GetOwnTavernData;
exports.GetNeighbor = GetNeighbor;
exports.GetResources = GetResources;
exports.GetClanMember = GetClanMember;
exports.GetFriends = GetFriends;
exports.GetTavernInfo = GetTavernInfo;
exports.GetVisitableTavern = GetVisitableTavern;
exports.GetLGResult = GetLGResult;
exports.GetArcBonus = GetArcBonus;
exports.GetTavernReward = GetTavernReward;
exports.GetMotivateResult = GetMotivateResult;
exports.GetTavernResult = GetTavernResult;
exports.GetTavernCollectResult = GetTavernCollectResult;

exports.clearLists = clearLists;