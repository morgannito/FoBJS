const { app, BrowserWindow, dialog, Menu, ipcMain, MenuItem } = require("electron");
const electronDl = require('electron-dl');
const fs = require('fs');
const path = require('path');
const prompt = require('electron-prompt');
const moment = require('moment');
const i18n = require("roddeh-i18n");
const storage = require('electron-json-storage');
const PossibleLanguage = require('./js/Languages').PossibleLanguages;
const proxy = require("./module/FoBProxy");
const builder = require("./module/FoBuilder");
const processer = require("./module/FoBProccess");
const FoBCore = require("./module/FoBCore");
const FoBFunctions = require("./module/FoBFunctions");
const FoBCommands = require("./module/FoBCommands");
const FoBProductionBot = require("./module/FoBProductionBot");
const FoBWorldParser = require("./module/FoBWorldParser");

const TimerClass = require("./js/timer").Timer;

const asarPath = path.join(app.getAppPath());

electronDl();

eApp = app;
exports.eApp = this.eApp;

storage.setDataPath(path.join(app.getPath("userData")));

storage.getAll((err, data) => {
    if (err) throw error;
    if (!(Object.entries(data).length === 0) && data.constructor === Object) {
        UserName = data["UserName"];
        Password = data["Password"];
        LastWorld = data["LastWorld"];
        PlayableWorld = data["PlayableWorld"];
        WorldServer = data["WorldServer"];
        Lng = data["Language"];
        if (Lng !== null && Lng !== undefined && typeof Lng === "string")
            moment.locale(Lng);
        else{
            moment.locale("de");
            Lng = "de";
            storage.set("Language","de")
        }
        ChangeLanguage(Lng);
    }
});

moment.relativeTimeThreshold("ss", 10);
moment.relativeTimeThreshold("s", 11);
moment.relativeTimeThreshold("m", 59);
moment.relativeTimeThreshold("h", 59);
moment.relativeTimeThreshold("d", 24);

let isDev = true;

/** @type {Array} */
const eState = { Producing: 1, Idle: 2, Finished: 3 };

/** @type {BrowserWindow} */
var Gwin = null;
/** @type {Menu} */
var menu = null;
/** @type {String} */
var VS = null;
/** @type {String} */
var VMM = null;
/** @type {Array} */
var Lwin = UserName = Password = LastWorld = WorldServer = Lng = null, PlayableWorld = {};
/** @type {Array} */
var UserIDs = {
    XSRF: null,
    CSRF: null,
    CID: null,
    SID: null,
    UID: null,
    WID: null,
    ForgeHX: null,
}
/** @type {Array} */
var UserData = {};
/** @type {Boolean} */
var stop = true;
/** @type {Array} */
var NeighborDict = NeighborMoppelDict = FriendsDict = FriendsMoppelDict = ClanMemberDict = ClanMemberMoppelDict = [];
var RefreshInfoID = null;
/** @type {Array} */
var ProductionTimerID = {};
/** @type {Boolean} */
var HideBigRoad = true, BotStarted = false;
/** @type {Array} */
var BotsRunning = {
    ProductionBot: false,
    RQBot: -1,
    TavernBot: -1,
    MoppelBot: -1,
    IncidentBot: -1
};
/** @type {Array} */
var BotsIntervall = {
    ProductionBot: null,
    TavernBot: 60,
    MoppelBot: (60 * 24) + 5
};
/** @type {Array} */
var CurrentProduction = { time: 5, id: 1, text: "5min" };
/** @type {Array} */
var CurrentGoodProduction = { time: 240, id: 1, text: "4h" };
var RunningTime = moment.now();
var SelectedTab = "Overview";
var CSSdata = null;
var timeString = null;
/** @type {Array} */
var Worlds = {};

var BlockFinish = BlockProduction = false;

if (fs.existsSync(path.join(app.getPath("userData"), "worlds.json"))) {
    var worlds = fs.readFileSync(path.join(app.getPath("userData"), "worlds.json"), "utf-8");
    Worlds = JSON.parse(worlds);
}

function createWindow() {
    let win = new BrowserWindow({
        title: "FoB v" + app.getVersion(),
        width: 910,
        height: 947,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            allowRunningInsecureContent: true
        },
        icon: path.join(asarPath, "icons", "png", "favicon.png")
    });
    Gwin = win;

    Gwin.loadFile(path.join(asarPath, "html", "login.html"));

    proxy.init();

    BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);

    ipcMain.on('loaded', () => {
        if (typeof WorldServer !== "string") {
            FoBCore.pWL(Gwin, app, false);
            Gwin.webContents.send('chooseServer', FoBCore.Servers);
            ipcMain.once("loadServer", (e, data) => {
                if (undefined !== FoBCore.Servers[data]) {
                    storage.set("WorldServer", data);
                    WorldServer = data;
                    Gwin.webContents.send('clear', "");
                    FoBCore.pWL(Gwin, app);
                    Gwin.webContents.send('fillCommands', FoBCommands.getLoginCommands());
                }
            });
        } else {
            FoBCore.pWL(Gwin, app);
            Gwin.webContents.send('fillCommands', FoBCommands.getLoginCommands());
        }
    });

    ipcMain.on("windowLoaded", (e, a) => {
        Gwin.webContents.send('toggleTab', SelectedTab);
    });

    ipcMain.on('executeCommand', (e, data) => {
        if (Array.isArray(data))
            if (data.length == 2)
                assocFunction(data[0], data[1])
            else
                return;
        else
            assocFunction(data)
    });

    process.on('uncaughtException', function (error) {
        dialog.showMessageBox(null, {
            type: 'error',
            buttons: ['Ok', "Quit"],
            defaultId: 0,
            title: 'Exception occured',
            message: 'Following Exception was thrown:',
            detail: error.message
        }, (response) => {
            if (response == 1) app.quit();
        })
    });

    SetupIpcMain();

    Gwin.on('closed', () => {
        Gwin, win = null
    });

    fs.readFile(path.join(asarPath, 'css', 'window.css'), "utf-8", function (error, data) {
        if (!error) {
            var formatedData = data.replace(/\s{2,10}/g, ' ').trim()
            CSSdata = formatedData;
        }
    });
}
app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})
function clickDO() {
    if (null === UserIDs.UID && UserName !== undefined && Password !== undefined && LastWorld !== undefined) {
        createBrowserWindowAuto("https://" + WorldServer + ".forgeofempires.com/");
    } else {
        Gwin.webContents.send('requestUsername', "Please enter your Username: ");
        ipcMain.once('getUsername', (event, data) => {
            if ("" !== data) {
                UserName = data;
                Gwin.webContents.send('requestPassword', "Please enter your Password: ");
                ipcMain.once('getPassword', (event, data) => {
                    if ("" !== data) {
                        Password = data;
                        createBrowserWindow("https://" + WorldServer + ".forgeofempires.com/");
                    }
                });
            }
        });
    }
}
async function downloadForgeHX() {
    let filePath = path.join(app.getPath("cache"),UserIDs.ForgeHX);
    if (!fs.existsSync(filePath)) {
        Gwin.webContents.send('info', "Searching cached " + UserIDs.ForgeHX);
        await electronDl.download(Gwin, "https://foede.innogamescdn.com//cache/" + UserIDs.ForgeHX, { directory: app.getPath("cache") });
        Gwin.webContents.send('info', UserIDs.ForgeHX + "cached");
    }

    let content = fs.readFileSync(filePath, 'utf8');
    if (content.length === 0) return;

    let re = /.VERSION_SECRET="([a-zA-Z0-9_\-\+\/==]+)";/ig;
    let rex = /.VERSION_MAJOR_MINOR="([0-9+\.0-9+\.0-9+]+)";/ig;
    re = new RegExp(re);
    rex = new RegExp(rex);
    let result = content.matchAll(re).next().value;
    let VERSION = content.matchAll(rex).next().value;
    if (null !== result) {
        if (result.length === 2) {
            //Gwin.webContents.send('print', "VERSION_SECRET found (" + result[1] + ")");
            VS = result[1];
        }
        else
            Gwin.webContents.send('print', "ERROR GETTING VERSION_SECRET");
    }
    if (null !== VERSION) {
        if (VERSION.length === 2) {
            //Gwin.webContents.send('print', "VERSION_SECRET found (" + result[1] + ")");
            VMM = VERSION[1];
        }
        else
            Gwin.webContents.send('print', "ERROR GETTING VERSION_SECRET");
    }
}
async function DoLogout() {
    UserIDs = {
        XSRF: null,
        CSRF: null,
        CID: null,
        SID: null,
        UID: null,
        WID: null,
        ForgeHX: null,
    }
    UserName = null;
    Password = null;
    LastWorld = null;
    PlayableWorld = [];
    WorldServer = null;
    storage.remove("UserName");
    storage.remove("Password");
    storage.remove("LastWorld");
    storage.remove("PlayableWorld");
    storage.remove("WorldServer");
    //await session.defaultSession.clearStorageData();
    BuildMenu(true, false, false, true, true, isDev);
    FoBCore.pWL(Gwin, app);
    Gwin.loadFile(path.join(asarPath, "html", "login.html"));
}
proxy.emitter.on("SID_Loaded", data => {
    if (UserIDs.SID === null || UserIDs.SID !== data) {
		console.log(`SID (${data}) loaded`);
        if (null !== data)
            UserIDs.SID = data;
    }
});
proxy.emitter.on("XSRF_Loaded", (data) => {
    if (UserIDs.XSRF === null || UserIDs.XSRF !== data) {
		console.log(`XSRF (${data}) loaded`);
        if (null !== data)
            UserIDs.XSRF = data;
    }
});
proxy.emitter.on("CSRF_Loaded", data => {
    if (UserIDs.CSRF === null || UserIDs.CSRF !== data) {
		console.log(`CSRF (${data}) loaded`);
        if (null !== data)
            UserIDs.CSRF = data;
    }
});
proxy.emitter.on("CID_Loaded", data => {
    if (UserIDs.CID === null || UserIDs.CID !== data) {
		console.log(`CID (${data}) loaded`);
        if (null !== data)
            UserIDs.CID = data;
    }
});
proxy.emitter.on("ForgeHX_Loaded", data => {
    if (UserIDs.ForgeHX === null || UserIDs.ForgeHX !== data) {
    		console.log(`ForgeHX (${data}) loaded`);
        if (null !== data)
            UserIDs.ForgeHX = data;
    }
});
proxy.emitter.on("WID_Loaded", data => {
    if (UserIDs.WID === null || UserIDs.WID !== data) {
		console.log(`WID (${data}) loaded`);
        if (null !== data)
            UserIDs.WID = data;
    }
});
proxy.emitter.on("UID_Loaded", data => {
    if (UserIDs.UID === null || UserIDs.UID !== data) {
        if (null !== data) {
            UserIDs.UID = data;
            downloadForgeHX().then(() => {
                if (null !== UserIDs.UID && !Lwin.isDestroyed()) {
                    Lwin.destroy();
                    Gwin.webContents.send('print', "Loading Bot...");
                    builder.init(UserIDs.UID, VS, VMM, UserIDs.WID);
                    GetData(true, () => {
                        BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
                        if (BotsRunning.ProductionBot) {
                            FoBProductionBot.StartProductionBot();
                        }
                    });
                    if (RefreshInfoID === null) {
                        var refreshTimer = new TimerClass(999, () => {
                            var durRunning = moment.duration(moment.unix(Math.round(new Date().getTime() / 1000)).diff(RunningTime));
                            var DurString = (!durRunning.days() ? (!durRunning.hours() ? (!durRunning.minutes() ? durRunning.seconds() + "sec" : durRunning.minutes() + "min " + durRunning.seconds() + "sec") : durRunning.hours() + "h " + durRunning.minutes() + "min " + durRunning.seconds() + "sec") : durRunning.days() + "d " + durRunning.hours() + "h " + durRunning.minutes() + "min " + durRunning.seconds() + "sec");
                            try {
                                Gwin.webContents.send('updateElement', ["RunningSince", DurString]);
                            } catch (error) {
                                app.exit();
                            }
                            durRunning = "";
                            DurString = "";
                        });
                        refreshTimer.start();
                        RefreshInfoID = refreshTimer.timeout;
                    }
                }
            });
        }
    }
});
FoBProductionBot.emitter.on("UpdateMenu", data => {
    PrepareInfoMenu();
});

function GetData(clear = true, callback = null, dorefresh = true) {
    processer.clearLists();
    FoBWorldParser.GetWorlds(() => Worlds = FoBWorldParser.Worlds);
    builder.GetFriends()
        .then(body => {
            FriendsDict = processer.GetFriends(body);
            //Gwin.webContents.send('print', "Friends Count: " + processer.FriendsDict.length);
            builder.GetNeighbor()
                .then(body => {
                    NeighborDict = processer.GetNeighbor(body);
                    //Gwin.webContents.send('print', "Neighbor Count: " + processer.NeighborDict.length);
                    builder.GetClanMember()
                        .then(body => {
                            ClanMemberDict = processer.GetClanMember(body);
                            //Gwin.webContents.send('print', "ClanMember Count: " + processer.ClanMemberDict.length);
                            builder.GetStartup()
                                .then(body => {
                                    UserData = processer.GetUserData(body);
                                    processer.GetResourceDefinitions(body);
                                    processer.GetTavernInfo(body);
                                    processer.GetResources(body);
                                    processer.GetOwnTavernInfo(body);
                                    processer.GetHiddenRewards(body);
                                    processer.GetBuildings(body);
                                    FoBFunctions.ArcBonus = processer.GetArcBonus(body);
                                    builder.GetMetaDataUrls(body, "city_entities").then(jsonbody => {
                                        if (jsonbody !== null) {
                                            processer.GetAllBuildings(jsonbody);
                                            processer.GetOwnBuildings();
                                            processer.GetDistinctProductList();
                                        }
                                        var StartUpBody = body;
                                        builder.DoGetOwnTavern()
                                            .then(body => {
                                                processer.GetOwnTavernData(body);
                                                builder.GetMetaDataUrls(StartUpBody, "research_eras").then(eras => {
                                                    if (eras !== null) {
                                                        //processer.GetErasDict(eras)
                                                        var GoodsDict = FoBCore.GetGoodsEraSorted(eras, processer.ResourceDict, processer.ResourceDefinitions);
                                                        processer.SetGoodsDict(GoodsDict);
                                                    }
                                                    if (clear) Gwin.webContents.send('clear', "");
                                                    Gwin.webContents.send('toggleOverlay', [false, ""]);
                                                    if (dorefresh)
                                                        PrepareInfoMenu();
                                                    if (!BotStarted) {
                                                        BotStarted = true;
                                                        PrepareInfoMenu();
                                                    }
                                                    if (!BotsRunning.ProductionBot && BotStarted) BotStarted = false;
                                                    if (callback !== null) {
                                                        callback();
                                                    }
                                                })
                                            })
                                    });
                                    //Gwin.webContents.send('print', "Possible Tavernvisits: " + processer.GetVisitableTavern(processer.FriendsDict).length);
                                });
                        });
                });
        });
}
function PrepareInfoMenu() {
    if (UserIDs.CID === null && UserIDs.UID === null && UserIDs.SID === null) {
        Gwin.loadFile(path.join(asarPath, "html", "login.html"));
        return;
    }
    var tavernState = "";
    if (processer.OwnTavernInfo[1] === processer.OwnTavernInfo[2])
        tavernState = "full";
    else tavernState = "sitting"

    let filePath = path.join(asarPath, 'html', 'window.html');
    var windowContent = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'tableContent', 'tableOverview.html');
    var tableOverview = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'tableContent', 'tableOtherPlayers.html');
    var tableOtherPlayers = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'tableContent', 'tableTavern.html');
    var tableTavern = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'tableContent', 'tableBots.html');
    var tableBots = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'tableContent', 'tableProductionList.html');
    var tableProductionList = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'tableContent', 'tableManually.html');
    var tableManually = fs.readFileSync(filePath, 'utf8');

    filePath = path.join(asarPath, 'html', 'insertContent', 'building.html');
    var buildingContent = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'insertContent', 'goods.html');
    var goodsContent = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'insertContent', 'inactiveFriends.html');
    var inactiveFriendsContent = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'insertContent', 'sittingPlayers.html');
    var sittingPlayersContent = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'insertContent', 'incidents.html');
    var incidentsContent = fs.readFileSync(filePath, 'utf8');

    var dProdList = processer.DProductionDict;
    var dGoodProdList = processer.DGoodProductionDict;

    NeighborMoppelDict = NeighborDict.filter((f) => f.canMotivate);
    FriendsMoppelDict = FriendsDict.filter((f) => f.canMotivate);
    ClanMemberMoppelDict = ClanMemberDict.filter((f) => f.canMotivate);

    var dList = dProdList.concat(dGoodProdList);

    tableOverview = tableOverview
        .replace("###CurWorld###", Worlds[UserIDs.WID] !== undefined ? Worlds[UserIDs.WID].name : UserIDs.WID)
        .replace('###RunningTime###', ``)
        .replace("###PlayerName###", `${UserData.UserName}`)
        .replace("###SupplyName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "supplies") }).name}`)
        .replace("###MoneyName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "money") }).name}`)
        .replace("###Supplies###", `${Math.floor(processer.ResourceDict.supplies).toLocaleString()}`)
        .replace("###Money###", `${Math.floor(processer.ResourceDict.money).toLocaleString()}`)
        .replace("###DiaName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "premium") }).name}`)
        .replace("###Dias###", `${Math.floor(processer.ResourceDict.premium).toLocaleString()}`)
        .replace("###MedsName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "medals") }).name}`)
        .replace("###Meds###", `${Math.floor(processer.ResourceDict.medals).toLocaleString()}`);

    for (const era in processer.GoodsDict) {
        if (processer.GoodsDict.hasOwnProperty(era)) {
            const obj = processer.GoodsDict[era];
            var local = goodsContent;
            for (let i = 0; i < obj["Goods"].length; i++) {
                const objGood = obj["Goods"][i];
                local = local.replace(`###Good${i}###`, `${objGood.name} (${objGood.amount})`);
                local = local.replace(`###Era###`, obj["Name"]);
            }
            tableOverview = tableOverview
                .replace("###Goods###", local);
        }
    }
    tableOverview = tableOverview
        .replace("###Goods###", "");

    var FriendInactive = FriendsDict.filter((f) => !f.item.is_active);
    tableOtherPlayers = tableOtherPlayers
        .replace("###Friends###", `${FriendsMoppelDict.length}/${FriendsDict.length}`)
        .replace("###Clan###", `${ClanMemberMoppelDict.length}/${ClanMemberDict.length}`)
        .replace("###Neighbor###", `${NeighborMoppelDict.length}/${NeighborDict.length}`)
    for (let i = 0; i < FriendInactive.length; i++) {
        const iFriend = FriendInactive[i];
        let local = inactiveFriendsContent;
        local = local
            .replace("###Name###", iFriend.item.name)
            .replace("###Score###", iFriend.item.score)
            .replace("###playerid###", iFriend.item.player_id)

        tableOtherPlayers = tableOtherPlayers
            .replace("###inactiveFriends###", local);
    }
    tableOtherPlayers = tableOtherPlayers
        .replace("###inactiveFriends###", "");



    tableTavern = tableTavern
        .replace("###TavernSilverName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "tavern_silver") }).name}`)
        .replace("###TavernSilverAmount###", `${processer.ResourceDict.tavern_silver}`)
        .replace("###Visitable###", processer.GetVisitableTavern(FriendsDict).length)
        .replace("###State###", `${processer.OwnTavernInfo[2]}/${processer.OwnTavernInfo[1]} ${tavernState}`)
    var visitableTavern = processer.GetVisitableTavern(FriendsDict);
    var SittingPlayers = processer.OwnTavernData["view"]["visitors"];
    for (let i = 0; i < SittingPlayers.length; i++) {
        const sPlayer = SittingPlayers[i];
        let local = sittingPlayersContent;
        local = local
            .replace("###PlayerName###", sPlayer.name)
            .replace("###PlayerID###", sPlayer.player_id);
        if (visitableTavern.find((v, i, a) => { v.key === sPlayer.player_id }))
            local = local.replace("###SitAtTavern###", `<button class="SitAtTavern" style="border: none; outline: none; font-size: 13px; padding: 5px 16px;">Sit at Tavern</button>`);
        else
            local = local.replace("###SitAtTavern###", `CAN NOT SIT DOWN`);

        tableTavern = tableTavern
            .replace("###SittingPlayers###", local);
    }
    tableTavern = tableTavern
        .replace("###SittingPlayers###", "");


    tableBots = tableBots.replace("###ProdBotState###", BotsRunning.ProductionBot === true ? "running" : (BotsRunning.ProductionBot === false ? "stopped" : "not implemented"))
    if (BotsRunning.ProductionBot === true) tableBots = tableBots.replace("###ProdBotColor###", "#00ff00").replace("###ProdBotButtonName###", "Stop");
    else if (BotsRunning.ProductionBot === false) tableBots = tableBots.replace("###ProdBotColor###", "#ff0000").replace("###ProdBotButtonName###", "Start");
    else if (BotsRunning.ProductionBot == -1) tableBots = tableBots.replace("###ProdBotColor###", "#0000ff".replace("###ProdBotButtonName###", "Nothing"));

    tableBots = tableBots.replace("###RQBotState###", BotsRunning.RQBot === true ? "running" : (BotsRunning.RQBot === false ? "stopped" : "not implemented"))
    if (BotsRunning.RQBot === true) tableBots = tableBots.replace("###RQBotColor###", "#00ff00").replace("###RQBotButtonName###", "Stop");
    else if (BotsRunning.RQBot === false) tableBots = tableBots.replace("###RQBotColor###", "#ff0000").replace("###RQBotButtonName###", "Start");
    else if (BotsRunning.RQBot == -1) tableBots = tableBots.replace("###RQBotColor###", "#0000ff").replace("###RQBotButtonName###", "Nothing");

    tableBots = tableBots.replace("###TavernBotState###", BotsRunning.TavernBot === true ? "running" : (BotsRunning.TavernBot === false ? "stopped" : "not implemented"))
    if (BotsRunning.TavernBot === true) tableBots = tableBots.replace("###TavernBotColor###", "#00ff00").replace("###TavernBotButtonName###", "Stop");
    else if (BotsRunning.TavernBot === false) tableBots = tableBots.replace("###TavernBotColor###", "#ff0000").replace("###TavernBotButtonName###", "Start");
    else if (BotsRunning.TavernBot == -1) tableBots = tableBots.replace("###TavernBotColor###", "#0000ff").replace("###TavernBotButtonName###", "Nothing");

    tableBots = tableBots.replace("###MoppelBotState###", BotsRunning.MoppelBot === true ? "running" : (BotsRunning.MoppelBot === false ? "stopped" : "not implemented"))
    if (BotsRunning.MoppelBot === true) tableBots = tableBots.replace("###MoppelBotColor###", "#00ff00").replace("###MoppelBotButtonName###", "Stop");
    else if (BotsRunning.MoppelBot === false) tableBots = tableBots.replace("###MoppelBotColor###", "#ff0000").replace("###MoppelBotButtonName###", "Start");
    else if (BotsRunning.MoppelBot == -1) tableBots = tableBots.replace("###MoppelBotColor###", "#0000ff").replace("###MoppelBotButtonName###", "Nothing");

    tableBots = tableBots.replace("###IncidentBotState###", BotsRunning.IncidentBot === true ? "running" : (BotsRunning.IncidentBot === false ? "stopped" : "not implemented"))
    if (BotsRunning.IncidentBot === true) tableBots = tableBots.replace("###IncidentBotColor###", "#00ff00").replace("###IncidentBotButtonName###", "Stop");
    else if (BotsRunning.IncidentBot === false) tableBots = tableBots.replace("###IncidentBotColor###", "#ff0000").replace("###IncidentBotButtonName###", "Start");
    else if (BotsRunning.IncidentBot == -1) tableBots = tableBots.replace("###IncidentBotColor###", "#0000ff").replace("###IncidentBotButtonName###", "Nothing");


    for (let key in dList) {
        if (!dList.hasOwnProperty(key)) return;
        var localContent = buildingContent;
        var prod = dList[key].prod;
        var count = dList[key].count;
        var prodName = s = production = "idle";
        if (prod["state"]["__class__"] === "ProducingState") {
            var end = moment.unix(prod["state"]["next_state_transition_at"]);
            var start = moment.unix(Math.round(new Date().getTime() / 1000));
            if ((start.isAfter(end) || start.isSame(end)) && ProductionTimerID[key] !== undefined) {
                ProductionTimerID[key]._timer.stop();
                ProductionTimerID[key] = undefined;
                Gwin.webContents.send('updateElement', ["BuidlingStatus" + key, "finished"]);
                if (BotsRunning.ProductionBot) {
                    if (!BlockFinish) {
                        BlockFinish = true;
                        FoBProductionBot.CollectManuel(Gwin, () => FoBProductionBot.StartManuel(Gwin));
                    }
                }
            }
            else {
                if (ProductionTimerID[key] === undefined) {
                    var prodTimer = new TimerClass(999 - parseInt(key), () => {
                        if (ProductionTimerID[key] == undefined) return false;
                        var end = moment.unix(ProductionTimerID[key].item.prod["state"]["next_state_transition_at"]);
                        var start = moment.unix(Math.round(new Date().getTime() / 1000));
                        var dur = moment.duration(end.diff(start));
                        if (start.isAfter(end) || start.isSame(end)) {
                            ProductionTimerID[key]._timer.stop();
                            ProductionTimerID[key] = undefined;
                            Gwin.webContents.send('updateElement', ["BuidlingStatus" + key, "finished"]);
                            if (BotsRunning.ProductionBot) {
                                if (!BlockFinish) {
                                    BlockFinish = true;
                                    FoBProductionBot.CollectManuel(Gwin, () => FoBProductionBot.StartManuel(Gwin));
                                }
                            }
                            return false;
                        }
                        timeString = `in ${(!dur.hours() ? (!dur.minutes() ? dur.seconds() + "sec" : dur.minutes() + "min " + dur.seconds() + "sec") : dur.hours() + "h " + dur.minutes() + "min " + dur.seconds() + "sec")}`;
                        BlockFinish = BlockProduction = false;
                        try {
                            Gwin.webContents.send('updateElement', ["BuidlingStatus" + key, timeString]);
                        } catch (error) {
                            app.exit();
                        }
                        durRunning = "";
                        DurString = "";
                    });
                    prodTimer.start();
                    ProductionTimerID[key] = { timout: prodTimer.timeout, item: dList[key], _timer: prodTimer };
                }
                production = Object.keys(prod["state"]["current_product"]["product"]["resources"])[0];
                prodName = count + "x " + prod["state"]["current_product"]["product"]["resources"][production] + " " + processer.ResourceDefinitions.find((v) => { return (v["id"] === production); })["name"] + ` (${count * prod["state"]["current_product"]["product"]["resources"][production]})`;
            }
        }
        else if (prod["state"]["__class__"] === "IdleState") {
            s = "idle"
            if (BotsRunning.ProductionBot) {
                if (!BlockProduction) {
                    BlockProduction = true;
                    FoBProductionBot.StartManuel(Gwin);
                }
            }
        }
        else if (prod["state"]["__class__"] === "ProductionFinishedState") {
            s = "finished";
            production = Object.keys(prod["state"]["current_product"]["product"]["resources"])[0];
            prodName = count + "x " + prod["state"]["current_product"]["product"]["resources"][production] + " " + processer.ResourceDefinitions.find((v) => { return (v["id"] === production); })["name"] + ` (${count * prod["state"]["current_product"]["product"]["resources"][production]})`;
            if (BotsRunning.ProductionBot) {
                if (!BlockFinish) {
                    BlockFinish = true;
                    FoBProductionBot.CollectManuel(Gwin, () => FoBProductionBot.StartManuel(Gwin));
                }
            }
        };
        localContent = localContent
            .replace("###BuildName###", count + "x " + prod["name"])
            .replace("###ProdName###", prodName)
            .replace("###ProdState###", s)
            .replace("###id###", key)
        tableProductionList = tableProductionList.replace("###Building###", localContent);
    }
    tableProductionList = tableProductionList.replace("###Building###", "");

    var visHidden = processer.HiddenRewards.filter((reward) => {
        if (reward.position === "cityRoadBig") {
            if (HideBigRoad)
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

    for (let i = 0; i < visHidden.length; i++) {
        const incident = visHidden[i];
        var localContent = incidentsContent;
        localContent = localContent
            .replace("###IncidentLocation###", incident.position)
            .replace("###IncidentRarity###", incident.rarity)
            .replace("###NoIncidentText###", "")
        tableManually = tableManually.replace("###Incidents###", localContent)
    }
    if (visHidden.length === 0) {
        var localContent = incidentsContent;
        localContent = localContent
            .replace("###IncidentLocation###", "")
            .replace("###IncidentRarity###", "")
            .replace("###NoIncidentText###", "NO INCIDENTS")
        tableManually = tableManually.replace("###Incidents###", localContent)
    }

    tableManually = tableManually.replace("###Incidents###", "")

    windowContent = windowContent
        .replace("###Overview###", tableOverview)
        .replace("###OtherPlayers###", tableOtherPlayers)
        .replace("###Tavern###", tableTavern)
        .replace("###Bots###", tableBots)
        .replace("###ProductionList###", tableProductionList)
        .replace("###Manually###", tableManually);

    filePath = path.join(asarPath, 'html', 'index.html');
    var index = fs.readFileSync(filePath, 'utf8');
    index = index.replace("###Display###", windowContent);

    Gwin.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(index)).then(() => {
        if (CSSdata !== null)
            Gwin.webContents.insertCSS(CSSdata);
        Gwin.webContents.send('information', windowContent);
        Gwin.webContents.executeJavaScript("loadEventHandler();");
    }).catch(r => {
        //console.log(r);
    });
    //FoBCore.printInfo(Gwin, windowContent);
}
function createBrowserWindow(url) {
    const win = new BrowserWindow({
        height: 600,
        width: 800
    });
    win.hide();
    win.loadURL(url);
    //win.webContents.openDevTools();
    win.webContents.once('dom-ready', () => {
        let filePath = path.join(asarPath, 'js', 'preloadLogin.js');
        var content = fs.readFileSync(filePath, 'utf8');
        storage.set("UserName", UserName);
        storage.set("Password", Password);
        let name = encodeURIComponent(UserName);
        let pass = encodeURIComponent(Password);
        content = content.replace(/###XSRF-TOKEN###/g, UserIDs.XSRF).replace(/###USERNAME###/g, name).replace(/###PASSWORD###/g, pass).replace(/###WorldServer###/g, WorldServer);
        win.webContents.executeJavaScript(`${content}`);
    });
    win.webContents.on("did-navigate-in-page", (e, url) => {
        if (stop) { stop = false; return; }
        let filePath = path.join(asarPath, 'js', 'preloadLoginWorld.js');
        var content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/###WorldServer###/g, WorldServer);
        win.webContents.executeJavaScript(`${content}`, true).then((result) => {
            let parsed = JSON.parse(result);
            data = parsed["player_worlds"];
            let worlds = parsed["worlds"];
            FoBWorldParser.FillWorldList(worlds, false, data);
            if (undefined !== FoBWorldParser.Worlds) {
                Gwin.webContents.send('print', "Choose from one of yours Worlds: ");
                var possWorlds = "";
                for (const key in FoBWorldParser.PlayerWorlds) {
                    if (data.hasOwnProperty(key)) {
                        Gwin.webContents.send('print', `${FoBWorldParser.PlayerWorlds[key].name}: ${key}`);
                        possWorlds += `${FoBWorldParser.PlayerWorlds[key].name}:${key},`
                    }
                }
                PlayableWorld = {};
                possWorlds.slice(0, -1).split(',').forEach((v) => {
                    let o = v.split(":");
                    PlayableWorld[o[1]] = o[0];
                });
                Gwin.webContents.send('chooseWorld', PlayableWorld);
                ipcMain.once('loadWorld', (event, data) => {
                    if (undefined !== PlayableWorld[data]) {
                        storage.set("LastWorld", data);
                        storage.set("PlayableWorld", PlayableWorld);
                        Gwin.webContents.send('clear', "");
                        let filePath = path.join(asarPath, 'js', 'preloadSelectWorld.js');
                        var content = fs.readFileSync(filePath, 'utf8');
                        content = content.replace(/###WORLD_ID###/g, data).replace(/###WorldServer###/g, WorldServer)
                        win.webContents.executeJavaScript(`${content}`);
                    }
                });
            }
        });
    });
    Lwin = win;
}
function SwitchWorld(world) {
    storage.set("LastWorld", world);
    UserIDs = {
        XSRF: null,
        CSRF: null,
        CID: null,
        SID: null,
        UID: null,
        WID: world,
        ForgeHX: null,
    }
    LastWorld = world;
    NeighborDict = [];
    FriendsDict = [];
    ClanMemberDict = [];
    clickDO();
    BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
}
function assocFunction(command, args = null) {
    var x = {
        'Login': async () => { return clickDO(); }
    }
    try {
        Gwin.webContents.send('print', "Executing " + command);
        Gwin.webContents.send('block', true);
        Gwin.webContents.send('clear', "");
        x[command]()
            .then(() => Gwin.webContents.send('block', false))
    } catch (e) {
        Gwin.webContents.send('print', "Command not available");
        Gwin.webContents.send('block', false);
    }
}
function createBrowserWindowAuto(url) {
    const win = new BrowserWindow({
        height: 600,
        width: 800
    });
    win.hide();
    win.loadURL(url);
    win.webContents.once('dom-ready', () => {
        let filePath = path.join(asarPath, 'js', 'preloadLogin.js');
        var content = fs.readFileSync(filePath, 'utf8');
        let name = encodeURIComponent(UserName);
        let pass = encodeURIComponent(Password);
        content = content.replace(/###XSRF-TOKEN###/g, UserIDs.XSRF).replace(/###USERNAME###/g, name).replace(/###PASSWORD###/g, pass).replace(/###WorldServer###/g, WorldServer);
        win.webContents.executeJavaScript(`${content}`);
    });
    win.webContents.on("did-navigate-in-page", (e, url) => {
        if (stop) { stop = false; return; }
        Gwin.webContents.send('clear', "");
        let filePath = path.join(asarPath, 'js', 'preloadSelectWorld.js');
        var content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/###WORLD_ID###/g, LastWorld).replace(/###WorldServer###/g, WorldServer)
        win.webContents.executeJavaScript(`${content}`);
    });
    Lwin = win;
}
function SwitchProduction(element, id) {
    CurrentProduction.id = element.id;
    CurrentProduction.time = id;
    CurrentProduction.text = element.text;
    exports.CurrentProduction = CurrentProduction;
    BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
}
function SwitchGoodProduction(element, id) {
    CurrentGoodProduction.id = element.id;
    CurrentGoodProduction.time = id;
    CurrentGoodProduction.text = element.text;
    exports.CurrentGoodProduction = CurrentGoodProduction;
    BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
}
function BuildMenu(login, logout, functions, settings, quit, devtools) {
    worlds = [];
    productionOptions = [];
    goodproductionOptions = [];
    Menu.setApplicationMenu(new Menu());
    menu = Menu.getApplicationMenu();

    if (login) addLogin(menu);
    if (logout) addLogout(menu);
    if (functions) addFunctions(menu);
    if (!login && settings) {
        for (const worldid in PlayableWorld) {
            if (PlayableWorld.hasOwnProperty(worldid)) {
                const element = PlayableWorld[worldid];
                if (worldid === UserIDs.WID)
                    worlds.push({ label: (Worlds[worldid] !== undefined ? Worlds[worldid].name : worldid) + " (Current)", id: worldid, click: () => { return; } });
                else
                    worlds.push({ label: (Worlds[worldid] !== undefined ? Worlds[worldid].name : worldid), id: worldid, click: () => { SwitchWorld(worldid); } });
            }
        }
        if (processer.ProductionDict.length > 0) {
            Options = FoBCore.getProductionOptions();
            for (const key in Options) {
                if (Options.hasOwnProperty(key)) {
                    const element = Options[key];
                    if (parseInt(key) === CurrentProduction.time)
                        productionOptions.push({ label: element.text + " (Current)", id: element.id, click: () => { return; } });
                    else
                        productionOptions.push({ label: element.text, id: element.id, click: () => { SwitchProduction(element, parseInt(key)); } });
                }
            }
        }
        if (processer.GoodProdDict.length > 0) {
            Options = FoBCore.getGoodsProductionOptions();
            for (const key in Options) {
                if (Options.hasOwnProperty(key)) {
                    const element = Options[key];
                    if (parseInt(key) === CurrentGoodProduction.time)
                        goodproductionOptions.push({ label: element.text + " (Current)", id: element.id, click: () => { return; } });
                    else
                        goodproductionOptions.push({ label: element.text, id: element.id, click: () => { SwitchGoodProduction(element, parseInt(key)); } });
                }
            }
        }
        addSettings(menu, worlds, productionOptions, goodproductionOptions);
    } else if (login && settings) {
        if (settings) addSettings(menu);
    }
    if (quit) addQuit(menu);
    if (devtools) addDevTools(menu);

    Menu.setApplicationMenu(menu);
}
function addLogin(menu) {
    mitem = new MenuItem({
        label: "Login",
        id: "login",
        click: () => clickDO()
    })
    menu.append(mitem);
}
function addLogout(menu) {
    mitem = new MenuItem({
        label: "Logout",
        id: "logout",
        click: () => DoLogout()
    })
    menu.append(mitem);
}
function addFunctions(menu) {
    var botItems = [];
    //Aid
    botItems.push({
        label: "Aid",
        id: "aid",
        submenu: [
            {
                label: `Aid Friends${FriendsDict.length > 0 ? "" : " (No Friends xD)"}`,
                id: "aidFriends",
                click: () => FriendsMoppelDict.length > 0 ? FoBFunctions.ExecuteMotivateFriends(Gwin, FriendsMoppelDict) : {}
            },
            {
                label: `Aid Neighbors${NeighborDict.length > 0 ? "" : " (No Neighbors)"}`,
                id: "aidNeighbors",
                click: () => NeighborMoppelDict.length > 0 ? FoBFunctions.ExecuteMotivateNeighbors(Gwin, NeighborMoppelDict) : {}
            },
            {
                label: `Aid Members${ClanMemberDict.length > 0 ? "" : " (No Members)"}`,
                id: "aidMembers",
                click: () => ClanMemberMoppelDict.length > 0 ? FoBFunctions.ExecuteMotivateMember(Gwin, ClanMemberMoppelDict) : {}
            },
            {
                label: `Aid All`,
                id: "aidAll",
                click: () => FoBFunctions.ExecuteMoppelAll(Gwin, FriendsMoppelDict, NeighborMoppelDict, ClanMemberMoppelDict)
            },
        ]
    });
    //Tavern
    botItems.push({
        label: "Tavern",
        id: "tavern",
        submenu: [
            {
                label: "Visit all Tavern ",
                id: "prodBot",
                click: () => FoBFunctions.ExecuteVisitTavern(Gwin, FriendsDict)
            }
        ]
    });
    //Bots
    botItems.push({
        label: "Bots",
        id: "bots",
        submenu: [
            {
                label: "Suche snippbare LGs",
                id: "SearchSnipLG",
                click: () => FoBFunctions.ExecuteSnipLGs(Gwin, FriendsDict, NeighborDict)
            }
        ]
    });
    //Others
    botItems.push({
        label: "Update Lists",
        id: "UpdateList",
        click: () => GetData()
    });

    mitem = new MenuItem({
        label: "Functions",
        id: "functions",
        submenu: botItems
    });
    menu.append(mitem);
}
function addSettings(menu, worlds = null, prodOptions = null, goodProdOptions = null) {
    var worldItem = [];
    if (null !== prodOptions) {
        worldItem.push({
            label: "Switch Production",
            id: "SwitchProduction",
            submenu: prodOptions
        })
    }
    if (null !== goodProdOptions) {
        worldItem.push({
            label: "Switch Goods Production",
            id: "SwitchGoodsProduction",
            submenu: goodProdOptions
        })
    }
    worldItem.push({
        label: "Set Tavern-Bot Checkintervall",
        id: "TavernbotIntervall",
        click: () => setTavernBotIntervall()
    });
    if (UserIDs.UID !== null) {
        worldItem.push({
            label: "Hide BigRoad: " + HideBigRoad, id: "hide_bigroad", click: () => {
                HideBigRoad = !HideBigRoad;
                BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
                PrepareInfoMenu();
                exports.HideBigRoad = HideBigRoad;
            }
        });
    }
    if (null !== worlds) {
        worldItem.push({
            label: "Switch Worlds",
            id: "SwitchWorlds",
            submenu: worlds
        })
    }
    worldItem.push({ label: "Clear Userdata", id: "ClearUserdata", click: () => { clearStorage() } });
    worldItem.push({ label: "Clear Everything", id: "ClearEverything", click: () => { clearStorage(true) } });

    var lng = [];
    for (const code in PossibleLanguage) {
        if (PossibleLanguage.hasOwnProperty(code)) {
            const name = PossibleLanguage[code];
            lng.push({
                label: name,
                id: "ChangeLanguageTo" + code,
                click: () => ChangeLanguage(code)
            });
        }
    }
    worldItem.push({ label: "Change Language", id: "Change Language", submenu: lng });

    mitem = new MenuItem({
        label: "Settings",
        id: "settings",
        submenu: worldItem
    });
    menu.append(mitem);
}
function addQuit(menu) {
    mitem = new MenuItem({
        label: "Quit",
        id: "quit",
        click: () => app.quit()
    })
    menu.append(mitem);
}
function addDevTools(menu) {
    mitem = new MenuItem({
        label: "DevTools",
        id: "devtools",
        click: () => Gwin.webContents.openDevTools()
    })
    menu.append(mitem);
}
function setTavernBotIntervall() {
    prompt({
        title: 'Set Tavern-Bot Intervall',
        label: 'Intervall in minutes: ',
        value: '60',
        inputAttrs: {
            type: 'number'
        },
        alwaysOnTop: true
    }, Gwin).then(r => {
        if (r !== null) {
            BotsIntervall.TavernBot = parseInt(r);
        }
    }).catch(err => {
        throw err;
    })
}
function clearStorage(force = false) {
    UserIDs = {
        XSRF: null,
        CSRF: null,
        CID: null,
        WID: null,
        ForgeHX: null,
    }
    UserName = null;
    Password = null;
    LastWorld = null;
    PlayableWorld = [];
    if (force) storage.clear(() => {
        DoLogout();
    });
    else
        storage.remove("UserName", () => {
            storage.remove("Password", () => {
                storage.remove("LastWorld", () => {
                    storage.remove("PlayableWorld", () => {
                        Gwin.webContents.send('print', "Userdata was cleared!");
                    });
                });
            });
        });



}
function SessionExpired() {
    FoBProductionBot.StopProductionBot();
    UserIDs.UID = null;
    Gwin.webContents.send('print', "Session Expired! SignIn again in 10 minutes");
    setTimeout(() => {
        RunningTime = moment.now();
        clickDO();
    }, 1000 * 60 * 10);
}
function SetupIpcMain() {
    ipcMain.on('removeFriend', (e, data) => {
        builder.RemoveFriend(data).then(() => {
            GetData(false);
            Gwin.webContents.send('toggleOverlay', [false, ""]);
        });
    });
    ipcMain.on('collectTavern', () => {
        FoBFunctions.CollectTavern(Gwin);
    });
    ipcMain.on('startProduction', () => {
        FoBProductionBot.StartManuel(Gwin)
    });
    ipcMain.on('collectProduction', () => {
        FoBProductionBot.CollectManuel(Gwin);
    });
    ipcMain.on('cancelProduction', () => {
        //FoBFunctions.CancelProduction();
    });
    ipcMain.on('collectIncidents', () => {
        FoBFunctions.ExecuteCollectRewards(Gwin)
    });
    ipcMain.on("setActiveTab", (e, data) => {
        SelectedTab = data;
    });
    ipcMain.on("DoProdBot", (e, d) => {
        BotsRunning.ProductionBot = d;
        BlockFinish = BlockProduction = false;
        GetData();
    })
}
async function ChangeLanguage(sL) {
    try {
        let languages = [];
        if (sL.toLowerCase() !== 'de') {
            languages.push('de');
            if (sL.toLowerCase() !== 'en') {
                languages.push('en');
            }
        }
        languages.push(sL.toLowerCase());
        const languageDatas = await Promise.all(
            languages
                .map(lang => {
                    if(fs.existsSync(path.join(asarPath, 'js', 'i18n', lang + '.json'))){
                        return fs.readFileSync(path.join(asarPath, 'js', 'i18n', lang + '.json'),"utf-8");
                    }else{
                        return {};
                    }
                })
        );
        for (let languageData of languageDatas) {
            languageData = languageData.replace(/\/\/Todo: Translate/g, '');
            i18n.translator.add(JSON.parse(languageData));
        }
    } catch (err) {
        console.error('i18n translation loading error:', err);
    }
}
exports.BotsRunning = BotsRunning;
exports.GetData = GetData;
exports.eState = eState;
exports.HideBigRoad = HideBigRoad;
exports.CurrentProduction = CurrentProduction;
exports.SessionExpired = SessionExpired;
exports.CurrentGoodProduction = CurrentGoodProduction;
exports.eApp = eApp;