/*
CREATED BY TH3C0D3R
*/
const { app, BrowserWindow, dialog, Menu, ipcMain, MenuItem, shell } = require("electron");
const electronDl = require('electron-dl');
const fs = require('fs');
const path = require('path');
const prompt = require('electron-prompt');
const moment = require('moment');
const i18n = require("roddeh-i18n");
const Store = require('electron-store');
const PossibleLanguage = require('./js/Languages').PossibleLanguages;
const proxy = require("./module/FoBProxy");
const builder = require("./module/FoBuilder");
const processer = require("./module/FoBProccess");
const FoBCore = require("./module/FoBCore");
const FoBFunctions = require("./module/FoBFunctions");
const FoBCommands = require("./module/FoBCommands");
const FoBProductionBot = require("./module/FoBProductionBot");
const FoBWorldParser = require("./module/FoBWorldParser");
FoBCore.debug(`Module loaded`);
const asarPath = path.join(app.getAppPath());
FoBCore.debug(`asar-Path loaded`);

electronDl();
eApp = app;
exports.eApp = this.eApp;
if (!fs.existsSync(app.getPath("userData"))) {
    fs.mkdirSync(app.getPath("userData"));
}

/** @type {Boolean} */
var isDev = false;

/** @type {Array} */
var eState = { Producing: 1, Idle: 2, Finished: 3 };
/** @type {BrowserWindow} */
var Gwin = null;
/** @type {BrowserWindow} */
var Lwin = null;
/** @type {Menu} */
var menu = null;
/** @type {String} */
var VS = null;
/** @type {String} */
var VMM = null;
/** @type {Array} */
var UserName = Password = LastWorld = WorldServer = Lng = undefined, PlayableWorld = Settings = {};
/** @type {Array} */
var ProductionTimer = {};
/** @type {Number} */
var RunningSince = null;
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
    MoppelBot: (60 * 24) + 5,
    IncidentBot: 60
};
/** @type {Array} */
var CurrentProduction = { time: 5, id: 1, text: "5min" };
/** @type {Array} */
var CurrentGoodProduction = { time: 240, id: 1, text: "4h" };
/** @type {String} */
var SelectedTab = "Overview";
var windowCSS = null;
/** @type {Array} */
var Worlds = {};

var BlockFinish = false;
var BlockProduction = false;
var Block = false;

FoBCore.debug(`Vars loaded`);



const store = new Store();
UserName = store.get("UserName");
Password = store.get("Password");
LastWorld = store.get("LastWorld");
PlayableWorld = store.get("PlayableWorld");
WorldServer = store.get("WorldServer");
Lng = store.get("Language");
Settings = store.get("Settings");
DarkMode = store.get("DarkMode");
DetailedDisplay = store.get("DetailedDisplay")
if (Lng === undefined) {
    Lng = "en";
    store.set('Language', Lng);
}
moment.locale(Lng);
ChangeLanguage(Lng);
if (Settings === undefined) Settings = {}
if (Object.entries(Settings).length == 0) {
    Settings.ProductionBot = false;
    Settings.IncidentBot = false;
    Settings.RQBot = false;
    Settings.TavernBot = false;
    Settings.MotivationBot = false;
    store.set("Settings", Settings);
}

FoBCore.debug(`Settings Loaded`);

moment.relativeTimeThreshold("ss", 10);
moment.relativeTimeThreshold("s", 11);
moment.relativeTimeThreshold("m", 59);
moment.relativeTimeThreshold("h", 59);
moment.relativeTimeThreshold("d", 24);
FoBCore.debug(`TimeThreshold loaded`);

if (fs.existsSync(path.join(app.getPath("userData"), "worlds.json"))) {
    var worlds = fs.readFileSync(path.join(app.getPath("userData"), "worlds.json"), "utf-8");
    Worlds = JSON.parse(worlds);
}
FoBCore.debug(`worlds.js loaded`);

if (Settings.ProductionBot) {
    FoBCore.debug(`Productionbot running from startup`);
    BotsRunning.ProductionBot = true;
}
function createWindow() {

    FoBFunctions.CheckUpdate(app.getVersion()).then((x = { hasUpdate, newVersion }) => {
        if (x.hasUpdate) {
            FoBCore.debug(`Update checked - v${x.newVersion} available`);
            FoBCore.promptUpdate(x.newVersion).then(response => {
                if (response.response == 0)
                    shell.openExternal("https://github.com/Th3C0D3R/FoBJS_Release/releases").then(() => {
                        app.quit();
                    });
            })
        } else {
            FoBCore.debug(`Update checked - no update available`);
            let win = new BrowserWindow({
                title: "FoB v" + app.getVersion() /*+ " | by TH3C0D3R"*/,
                width: 910,
                height: 947,
                webPreferences: {
                    nodeIntegration: true,
                    webSecurity: false,
                    enableRemoteModule: true,
                    allowRunningInsecureContent: true
                },
                icon: path.join(asarPath, "icons", "png", "favicon.png")
            });
            Gwin = win;

            Gwin.loadFile(path.join(asarPath, "html", "login.html"));
            FoBCore.debug(`login.html loaded`);

            proxy.init();
            FoBCore.debug(`proxy loaded`);

            BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
            FoBCore.debug(`Menu built`);

            ipcMain.on('loaded', () => {
                FoBCore.debug(`BrowserWindow loaded`);
                if (typeof WorldServer !== "string") {
                    PrintServerSelection();
                } else {
                    Gwin.webContents.send('fillCommands', FoBCommands.getLoginCommands());
                    if (((UserName !== null && Password !== null && LastWorld !== null) && (UserName !== undefined && Password !== undefined && LastWorld !== undefined))) {
                        FoBCore.printAutoLogInMessage(Gwin)
                        clickDO(); 
                    }else{
                        FoBCore.pWL(Gwin, app);
                    }
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
            FoBCore.debug(`IPC's loaded`);

            Gwin.on('closed', () => {
                Gwin, win = null
            });

            fs.readFile(path.join(asarPath, 'css', DarkMode? 'windowdark.css' : 'window.css'), "utf-8", function (error, data) {
                if (!error) {
                    var formatedData = data.replace(/\s{2,10}/g, ' ').trim()
                    windowCSS = formatedData;
                }
            });
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
    if (null === UserIDs.UID && ((UserName !== null && Password !== null && LastWorld !== null) && (UserName !== undefined && Password !== undefined && LastWorld !== undefined))) {
        FoBCore.debug(`Username, Password and LastWorld found`);
        createBrowserWindowAuto("https://" + WorldServer + ".forgeofempires.com/");
    } else {
        FoBCore.debug(`No saved Data found`);
        FoBCore.debug(`request Username`);
        Gwin.webContents.send('requestUsername', i18n("Login.EnterUsername"));
        ipcMain.once('getUsername', GotUsername);
    }
}
function GotUsername(e, data) {
    if ("" !== data) {
        UserName = data;
        FoBCore.debug(`request Password`);
        Gwin.webContents.send('requestPassword', i18n("Login.EnterPassword"));
        ipcMain.once('getPassword', GotPassword);
    }
}
function GotPassword(e, data) {
    if ("" !== data) {
        Password = data;
        createBrowserWindow("https://" + WorldServer + ".forgeofempires.com/");
    }
}
async function downloadForgeHX() {
    let filePath = path.join(app.getPath("cache"), UserIDs.ForgeHX);
    if (!fs.existsSync(filePath)) {
        Gwin.webContents.send('info', "Caching " + UserIDs.ForgeHX);
        FoBCore.debug(`Caching ${UserIDs.ForgeHX}`);
        await electronDl.download(Gwin, "https://foe" + WorldServer + ".innogamescdn.com//cache/" + UserIDs.ForgeHX, { directory: app.getPath("cache") });
        Gwin.webContents.send('info', UserIDs.ForgeHX + " cached");
        FoBCore.debug(`${UserIDs.ForgeHX} downloaded to ${app.getPath("cache")}`);
    }

    let content = fs.readFileSync(filePath, 'utf8');
    if (content.length === 0 || content.trim().length === 0) {
        FoBCore.debug(`${UserIDs.ForgeHX} invalid, has no content`);
        return;
    }
    var indexStart = content.indexOf(".BUILD_NUMBER=\"");
    var indexEnd = content.indexOf(".TILE_SPEC_NAME_CONTEMPORARY_BUSHES=\"");
    content = content.substr(indexStart,(indexEnd-indexStart));
    content = content.replace("\n","").replace("\r","");
    let re = /.VERSION_SECRET="([a-zA-Z0-9_\-\+\/==]+)";/ig;
    let rex = /.VERSION_MAJOR_MINOR="([0-9+\.0-9+\.0-9+]+|[0-9+\.0-9+]+|[0-9+])";/ig;
    re = new RegExp(re);
    rex = new RegExp(rex);
    let result = content.matchAll(re).next().value;
    let VERSION = content.matchAll(rex).next().value;
    if (undefined !== result) {
        if (result.length === 2) {
            FoBCore.debug(`VersionSecret found: ${result[1]}`);
            VS = result[1];
        }
        else {
            Gwin.webContents.send('print', "FAILED GETTING VERSION_SECRET");
            FoBCore.debug(`FAILED GETTING VERSION_SECRET`);
        }
    }
    if (undefined !== VERSION) {
        if (VERSION.length === 2) {
            FoBCore.debug(`Version found: ${VERSION[1]}`);
            VMM = VERSION[1];
        }
        else {
            Gwin.webContents.send('print', "FAILED GETTING VERSION");
            FoBCore.debug(`FAILED GETTING VERSION`);
        }
    }
}
async function DoLogout() {
    Gwin.webContents.send('clear', "");
    FoBCore.debug(`Doing Logout`);
    UserIDs = {
        XSRF: null,
        CSRF: null,
        CID: null,
        SID: null,
        UID: null,
        WID: null,
        ForgeHX: null,
    }
    FoBCore.debug(`UserData cleard`);
    UserName = null;
    Password = null;
    LastWorld = null;
    PlayableWorld = [];
    WorldServer = null;
    store.delete("UserName");
    store.delete("Password");
    store.delete("LastWorld");
    store.delete("PlayableWorld");
    store.delete("WorldServer");
    FoBCore.debug(`UserData completly cleared`);
    BuildMenu(true, false, false, true, true, isDev);
    FoBCore.pWL(Gwin, app);
    Gwin.loadFile(path.join(asarPath, "html", "login.html"));
}
proxy.emitter.on("SID_Loaded", data => {
    if (UserIDs.SID === null || UserIDs.SID !== data) {
        FoBCore.debug(`SID (${data}) loaded`);
        if (null !== data)
            UserIDs.SID = data;
    }
});
proxy.emitter.on("XSRF_Loaded", (data) => {
    if (UserIDs.XSRF === null || UserIDs.XSRF !== data) {
        FoBCore.debug(`XSRF (${data}) loaded`);
        if (null !== data)
            UserIDs.XSRF = data;
    }
});
proxy.emitter.on("CSRF_Loaded", data => {
    if (UserIDs.CSRF === null || UserIDs.CSRF !== data) {
        FoBCore.debug(`CSRF (${data}) loaded`);
        if (null !== data)
            UserIDs.CSRF = data;
    }
});
proxy.emitter.on("CID_Loaded", data => {
    if (UserIDs.CID === null || UserIDs.CID !== data) {
        FoBCore.debug(`CID (${data}) loaded`);
        if (null !== data)
            UserIDs.CID = data;
    }
});
proxy.emitter.on("ForgeHX_Loaded", data => {
    if (UserIDs.ForgeHX === null) {
        FoBCore.debug(`new ForgeHX (${data}) loaded`);
        if (null !== data)
            UserIDs.ForgeHX = data;
    }
});
proxy.emitter.on("WID_Loaded", data => {
    if (UserIDs.WID === null || UserIDs.WID !== data) {
        FoBCore.debug(`WID (${data}) loaded`);
        if (null !== data)
            UserIDs.WID = data;
    }
});
proxy.emitter.on("UID_Loaded", data => {
    if (UserIDs.UID === null || UserIDs.UID !== data) {
        if (null !== data) {
            FoBCore.debug(`UID (${data}) loaded`);
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
            builder.GetNeighbor()
                .then(body => {
                    NeighborDict = processer.GetNeighbor(body);
                    builder.GetClanMember()
                        .then(body => {
                            ClanMemberDict = processer.GetClanMember(body);
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
                                            processer.GetDistinctProductList(!store.get("DetailedDisplay"));
                                        }
                                        var StartUpBody = body;
                                        builder.DoGetOwnTavern()
                                            .then(body => {
                                                processer.GetOwnTavernData(body);
                                                builder.GetMetaDataUrls(StartUpBody, "research_eras").then(eras => {
                                                    if (eras !== null) {
                                                        var GoodsDict = FoBCore.GetGoodsEraSorted(eras, processer.ResourceDict, processer.ResourceDefinitions);
                                                        processer.SetGoodsDict(GoodsDict);
                                                    }
                                                    if (clear) Gwin.webContents.send('clear', "");
                                                    Gwin.webContents.send('toggleOverlay', [false, ""]);
                                                    if (dorefresh)
                                                        PrepareInfoMenu();
                                                    if (!BotStarted && dorefresh) {
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
                                });
                        });
                });
        });
}
var tableProductionList = undefined;
var buildingContent = undefined;
var lastSend = new Date()
function PrepareInfoMenu() {
    if (UserIDs.CID === null && UserIDs.UID === null && UserIDs.SID === null) {
        Gwin.loadFile(path.join(asarPath, "html", "login.html"));
        return;
    }
    var tavernState = "";
    if (processer.OwnTavernInfo[1] === processer.OwnTavernInfo[2])
        if (processer.OwnTavernInfo[1] !== undefined && processer.OwnTavernInfo[2] !== undefined)
            tavernState = i18n("Tavern.State.Full");
        else
            tavernState = "";
    else tavernState = i18n("Tavern.State.Sitting");

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
    tableProductionList = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'tableContent', 'tableManually.html');
    var tableManually = fs.readFileSync(filePath, 'utf8');

    filePath = path.join(asarPath, 'html', 'insertContent', 'building.html');
    buildingContent = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'insertContent', 'goods.html');
    var goodsContent = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'insertContent', 'inactiveFriends.html');
    var inactiveFriendsContent = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'insertContent', 'sittingPlayers.html');
    var sittingPlayersContent = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath, 'html', 'insertContent', 'incidents.html');
    var incidentsContent = fs.readFileSync(filePath, 'utf8');

    var dProdList = processer.DProductionDict /*processer.ProductionDict*/;
    var dGoodProdList = processer.DGoodProductionDict /*processer.GoodProdDict*/;
    var dOtherList = processer.DAllOtherDict /*processer.AllOtherDict*/;
    var dResidList = processer.DResidentialDict /*processer.ResidentialDict*/;

    NeighborMoppelDict = NeighborDict.filter((f) => f.canMotivate);
    FriendsMoppelDict = FriendsDict.filter((f) => f.canMotivate);
    ClanMemberMoppelDict = ClanMemberDict.filter((f) => f.canMotivate);

    // var dList = dProdList.concat(dGoodProdList /*,dOtherList , dResidList */);

    tableOverview = tableOverview
        .replace("###CurWorld###", Worlds[UserIDs.WID] !== undefined ? Worlds[UserIDs.WID].name : UserIDs.WID)
        .replace('###RunningTime###', ``)
        .replace("###PlayerName###", `${UserData.UserName}`)
        .replace("###SupplyName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "supplies") }).name}`)
        .replace("###MoneyName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "money") }).name}`)
        .replace("###StrategyPointsName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "strategy_points") }).name}`)
        .replace("###Supplies###", `${Math.floor(processer.ResourceDict.supplies).toLocaleString()}`)
        .replace("###Money###", `${Math.floor(processer.ResourceDict.money).toLocaleString()}`)
        .replace("###StrategyPoints###", `${Math.floor(processer.ResourceDict.strategy_points).toLocaleString()}`)
        .replace("###DiaName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "premium") }).name}`)
        .replace("###Dias###", `${Math.floor(processer.ResourceDict.premium).toLocaleString()}`)
        .replace("###MedsName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "medals") }).name}`)
        .replace("###Meds###", `${Math.floor(processer.ResourceDict.medals).toLocaleString()}`)
        .replace("###Overview.CurrentWorld###", i18n("Overview.CurrentWorld"))
        .replace("###Overview.Player###", i18n("Overview.Player"))
        .replace("###Overview.RunningSince###", i18n("Overview.RunningSince"));

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
        .replace("###OtherPlayers.Friends###", i18n("OtherPlayers.Friends"))
        .replace("###OtherPlayers.Clanmember###", i18n("OtherPlayers.Clanmember"))
        .replace("###OtherPlayers.Neighbor###", i18n("OtherPlayers.Neighbor"))
        .replace("###OtherPlayers.InactiveFriends###", i18n("OtherPlayers.InactiveFriends"))
    for (let i = 0; i < FriendInactive.length; i++) {
        const iFriend = FriendInactive[i];
        let local = inactiveFriendsContent;
        local = local
            .replace("###Name###", iFriend.item.name)
            .replace("###Score###", iFriend.item.score)
            .replace("###playerid###", iFriend.item.player_id)
            .replace("###RemoveFriend###", i18n("OtherPlayers.Button.Remove"))

        tableOtherPlayers = tableOtherPlayers
            .replace("###inactiveFriends###", local);
    }
    tableOtherPlayers = tableOtherPlayers
        .replace("###inactiveFriends###", "");
    tableTavern = tableTavern
        .replace("###TavernSilverName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "tavern_silver") }).name}`)
        .replace("###TavernSilverAmount###", `${processer.ResourceDict.tavern_silver}`)
        .replace("###Visitable###", processer.GetVisitableTavern(FriendsDict).length)
        .replace("###Tavern.State###", i18n("Tavern.State"))
        .replace("###Tavern.Visitable###", i18n("Tavern.Visitable"))
        .replace("###Tavern.Button.Collect###", i18n("Tavern.Button.Collect"))
        .replace("###Tavern.CurrentSittingPlayer###", i18n("Tavern.CurrentSittingPlayer"))
        .replace("###Tavern.Playername###", i18n("Tavern.Playername"))
        .replace("###Tavern.Playerid###", i18n("Tavern.Playerid"))

    if (tavernState !== "")
        tableTavern = tableTavern.replace("###State###", `${processer.OwnTavernInfo[2]}/${processer.OwnTavernInfo[1]} ${tavernState}`)
    else
        tableTavern = tableTavern.replace("###State###", i18n("Tavern.State.NoTavern"));
    var visitableTavern = processer.GetVisitableTavern(FriendsDict);
    var SittingPlayers = [];
    if (processer.OwnTavernData["view"] !== undefined)
        SittingPlayers = processer.OwnTavernData["view"]["visitors"];
    for (let i = 0; i < SittingPlayers.length; i++) {
        const sPlayer = SittingPlayers[i];
        let local = sittingPlayersContent;
        local = local
            .replace("###PlayerName###", sPlayer.name)
            .replace("###PlayerID###", sPlayer.player_id);
        if (visitableTavern.find((v, i, a) => { v.key === sPlayer.player_id }))
            local = local.replace("###SitAtTavern###", `<button class="SitAtTavern" style="border: none; outline: none; font-size: 13px; padding: 5px 16px;">${i18n("Tavern.Visitable")}</button>`);
        else
            local = local.replace("###SitAtTavern###", `${i18n("Tavern.CannotSitDown")}`);

        tableTavern = tableTavern
            .replace("###SittingPlayers###", local);
    }
    tableTavern = tableTavern
        .replace("###SittingPlayers###", "");

    tableBots = tableBots.replace("###ProdBotState###", BotsRunning.ProductionBot === true ? i18n("Bots.Running") : (BotsRunning.ProductionBot === false ? i18n("Bots.Stopped") : i18n("Bots.NotImplemented")))
    tableBots = tableBots
        .replace("###ProdBotBoolState###", BotsRunning.ProductionBot)
        .replace("###Bots.Heading###", i18n("Bots.Heading"))
        .replace("###Bots.ProductionBotName###", i18n("Bots.ProductionBotName"))
        .replace("###Bots.RecurringQuestBotName###", i18n("Bots.RecurringQuestBotName"))
        .replace("###Bots.TavernenBotName###", i18n("Bots.TavernenBotName"))
        .replace("###Bots.MotivateBotName###", i18n("Bots.MotivateBotName"))
        .replace("###Bots.IncidentBotName###", i18n("Bots.IncidentBotName"));
    if (BotsRunning.ProductionBot === true) tableBots = tableBots.replace("###ProdBotColor###", "#00ff00").replace("###ProdBotButtonName###", i18n("Bots.Stop"));
    else if (BotsRunning.ProductionBot === false) tableBots = tableBots.replace("###ProdBotColor###", "#ff0000").replace("###ProdBotButtonName###", i18n("Bots.Start"));
    else if (BotsRunning.ProductionBot == -1) tableBots = tableBots.replace("###ProdBotColor###", "#0000ff").replace("###ProdBotButtonName###", i18n("Bots.Nothing"));

    tableBots = tableBots.replace("###RQBotState###", BotsRunning.RQBot === true ? i18n("Bots.Running") : (BotsRunning.RQBot === false ? i18n("Bots.Stopped") : i18n("Bots.NotImplemented")))
    if (BotsRunning.RQBot === true) tableBots = tableBots.replace("###RQBotColor###", "#00ff00").replace("###RQBotButtonName###", i18n("Bots.Stop"));
    else if (BotsRunning.RQBot === false) tableBots = tableBots.replace("###RQBotColor###", "#ff0000").replace("###RQBotButtonName###", i18n("Bots.Start"));
    else if (BotsRunning.RQBot == -1) tableBots = tableBots.replace("###RQBotColor###", "#0000ff").replace("###RQBotButtonName###", i18n("Bots.Nothing"));

    tableBots = tableBots.replace("###TavernBotState###", BotsRunning.TavernBot === true ? i18n("Bots.Running") : (BotsRunning.TavernBot === false ? i18n("Bots.Stopped") : i18n("Bots.NotImplemented")))
    if (BotsRunning.TavernBot === true) tableBots = tableBots.replace("###TavernBotColor###", "#00ff00").replace("###TavernBotButtonName###", i18n("Bots.Stop"));
    else if (BotsRunning.TavernBot === false) tableBots = tableBots.replace("###TavernBotColor###", "#ff0000").replace("###TavernBotButtonName###", i18n("Bots.Start"));
    else if (BotsRunning.TavernBot == -1) tableBots = tableBots.replace("###TavernBotColor###", "#0000ff").replace("###TavernBotButtonName###", i18n("Bots.Nothing"));

    tableBots = tableBots.replace("###MoppelBotState###", BotsRunning.MoppelBot === true ? i18n("Bots.Running") : (BotsRunning.MoppelBot === false ? i18n("Bots.Stopped") : i18n("Bots.NotImplemented")))
    if (BotsRunning.MoppelBot === true) tableBots = tableBots.replace("###MoppelBotColor###", "#00ff00").replace("###MoppelBotButtonName###", i18n("Bots.Stop"));
    else if (BotsRunning.MoppelBot === false) tableBots = tableBots.replace("###MoppelBotColor###", "#ff0000").replace("###MoppelBotButtonName###", i18n("Bots.Start"));
    else if (BotsRunning.MoppelBot == -1) tableBots = tableBots.replace("###MoppelBotColor###", "#0000ff").replace("###MoppelBotButtonName###", i18n("Bots.Nothing"));

    tableBots = tableBots.replace("###IncidentBotState###", BotsRunning.IncidentBot === true ? i18n("Bots.Running") : (BotsRunning.IncidentBot === false ? i18n("Bots.Stopped") : i18n("Bots.NotImplemented")))
    if (BotsRunning.IncidentBot === true) tableBots = tableBots.replace("###IncidentBotColor###", "#00ff00").replace("###IncidentBotButtonName###", i18n("Bots.Stop"));
    else if (BotsRunning.IncidentBot === false) tableBots = tableBots.replace("###IncidentBotColor###", "#ff0000").replace("###IncidentBotButtonName###", i18n("Bots.Start"));
    else if (BotsRunning.IncidentBot == -1) tableBots = tableBots.replace("###IncidentBotColor###", "#0000ff").replace("###IncidentBotButtonName###", i18n("Bots.Nothing"));


    displayList(dProdList);
    addDivision()
    displayList(dGoodProdList);
    // addDivision()
    // displayList(dResidList);
    // addDivision()
    // displayList(dOtherList);
    tableProductionList = tableProductionList
        .replace("###Building###", "")
        .replace("###Production.Heading###", i18n("Production.Heading"))
        .replace("###Production.Building###", i18n("Production.Building"))
        .replace("###Production.Product###", i18n("Production.Product"))
        .replace("###Production.State###", i18n("Production.State"));

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
            .replace("###NoIncidentText###", i18n("Manually.NoIncidents"))
        tableManually = tableManually.replace("###Incidents###", localContent)
    }

    tableManually = tableManually
        .replace("###Incidents###", "")
        .replace("###Manually.StartProd###", i18n("Manually.StartProd"))
        .replace("###Manually.CollectProd###", i18n("Manually.CollectProd"))
        .replace("###Manually.CancelProd###", i18n("Manually.CancelProd"))
        .replace("###Manually.CollectIncidents###", i18n("Manually.CollectIncidents"))

    windowContent = windowContent
        .replace("###Overview###", tableOverview)
        .replace("###OtherPlayers###", tableOtherPlayers)
        .replace("###Tavern###", tableTavern)
        .replace("###Bots###", tableBots)
        .replace("###ProductionList###", tableProductionList)
        .replace("###Manually###", tableManually)
        .replace("###Window.Tab.Overview###", i18n("Window.Tab.Overview"))
        .replace("###Window.Tab.OtherPlayers###", i18n("Window.Tab.OtherPlayers"))
        .replace("###Window.Tab.Tavern###", i18n("Window.Tab.Tavern"))
        .replace("###Window.Tab.Bots###", i18n("Window.Tab.Bots"))
        .replace("###Window.Tab.Production###", i18n("Window.Tab.Production"))
        .replace("###Window.Tab.Manually###", i18n("Window.Tab.Manually"));

    filePath = path.join(asarPath, 'html', 'index.html');
    var index = fs.readFileSync(filePath, 'utf8');
    index = index
        .replace("###Display###", windowContent)
        .replace("###CollectIncidents###", i18n("Overlay.CollectIncidents"))
        .replace("###CancelProduction###", i18n("Overlay.CancelProdcution"))
        .replace("###CollectProduction###", i18n("Overlay.CollectProdcution"))
        .replace("###StartProduction###", i18n("Overlay.StartProdcution"))
        .replace("###CollectTavern###", i18n("Overlay.CollectTavern"))
        .replace("###RemoveFriend###", i18n("Overlay.RemoveFriend"))
        .replace("###Finished###", i18n("Production.Finished"));

    Gwin.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(index)).then(() => {
        if (windowCSS !== null)
            Gwin.webContents.insertCSS(windowCSS);
        Gwin.webContents.send('loadEventHandler', "");
        if (RunningSince === undefined || RunningSince === null) {
            RunningSince = moment.unix(Math.round(new Date().getTime() / 1000));
        } else {
            var now = new Date()
            if (now > lastSend) {
                FoBCore.debug(`sendProductionState ${Block}, ${BlockFinish}, ${BlockProduction}`);
                Block = false;
                Gwin.webContents.send('sendProductionState', [ProductionTimer, BlockFinish, BlockProduction, Block]);
                now.setSeconds(now.getSeconds() + 1)
                lastSend = now
            }
        }
        Gwin.webContents.send('sendRunningTime', RunningSince.valueOf());
    }).catch(r => {
        FoBCore.error(r.code + " - " + r.errno)
        dialog.showMessageBox(null,{message : `${r.code} - ${r.errno} loadURL catch`})
    });
}
function addDivision(){
    tableProductionList = tableProductionList
        .replace("###Building###", "<tr><td style=\"width: auto; text-align: center;\" colspan=\"3\"><hr /></td></tr>###Building###")
}
function displayList(dList){
    for (let _key in dList) {
        if (!dList.hasOwnProperty(_key)) return;
        var localContent = buildingContent;
        var prod = (dList[_key]["prod"] !== undefined) ? dList[_key].prod : ((dList[_key]["res"] !== undefined) ? dList[_key].res : null);
        /* var prod = dList[_key]; */
        if (prod == null) continue;
        var count = dList[_key].count;
        var prodName = s = production = i18n("Production.Idle");
        var key = prod["id"];
        if (prod["state"]["__class__"] === "ProducingState") {
            var end = moment.unix(prod["state"]["next_state_transition_at"]);
            var start = moment.unix(Math.round(new Date().getTime() / 1000));
            if ((start.isAfter(end) || start.isSame(end)) && ProductionTimer[key] !== undefined) {
                ProductionTimer[key]["finished"] = true;
                ProductionTimer[key]["string_state"] = i18n("Production.Finished");
                ProductionTimer[key]["nextStateAt"] = 0;
                ProductionTimer[key]["nextStateIn"] = 0;
                ProductionTimer[key]["key"] = key;
                ProductionTimer[key]["ProdBotRunning"] = BotsRunning.ProductionBot;
            }
            else {
                if (ProductionTimer[key] === undefined) {
                    ProductionTimer[key] = {};
                }
                ProductionTimer[key]["string_state"] = i18n("Production.Producing");
                ProductionTimer[key]["finished"] = false;
                ProductionTimer[key]["nextStateAt"] = prod["state"]["next_state_transition_at"];
                ProductionTimer[key]["nextStateIn"] = prod["state"]["next_state_transition_in"];
                ProductionTimer[key]["key"] = key;
                ProductionTimer[key]["ProdBotRunning"] = BotsRunning.ProductionBot;
                s = "producing (default)"
                production = Object.keys(prod["state"]["current_product"]["product"]["resources"])[0];
                if (DetailedDisplay) {
                    prodName = prod["state"]["current_product"]["product"]["resources"][production] + " " + processer.ResourceDefinitions.find((v) => { return (v["id"] === production); })["name"];
                }else{
                    prodName = count + "x " + prod["state"]["current_product"]["product"]["resources"][production] + " " + processer.ResourceDefinitions.find((v) => { return (v["id"] === production); })["name"] + ` (${count * prod["state"]["current_product"]["product"]["resources"][production]})`;
                }
            }
        }
        else if (prod["state"]["__class__"] === "IdleState") {
            if (ProductionTimer[key] === undefined) {
                ProductionTimer[key] = {};
            }
            ProductionTimer[key]["string_state"] = i18n("Production.Idle");
            ProductionTimer[key]["finished"] = false;
            ProductionTimer[key]["nextStateAt"] = 0;
            ProductionTimer[key]["nextStateIn"] = 0;
            ProductionTimer[key]["key"] = key;
            ProductionTimer[key]["ProdBotRunning"] = BotsRunning.ProductionBot;
            s = "idle (default)"
        }
        else if (prod["state"]["__class__"] === "ProductionFinishedState") {
            s = "finished (default)";
            production = Object.keys(prod["state"]["current_product"]["product"]["resources"])[0];
            prodName = count + "x " + prod["state"]["current_product"]["product"]["resources"][production] + " " + processer.ResourceDefinitions.find((v) => { return (v["id"] === production); })["name"] + ` (${count * prod["state"]["current_product"]["product"]["resources"][production]})`;
            if (ProductionTimer[key] === undefined) {
                ProductionTimer[key] = {};
            }
            ProductionTimer[key]["string_state"] = i18n("Production.Finished");
            ProductionTimer[key]["finished"] = true;
            ProductionTimer[key]["nextStateAt"] = 0;
            ProductionTimer[key]["nextStateIn"] = 0;
            ProductionTimer[key]["key"] = key;
            ProductionTimer[key]["ProdBotRunning"] = BotsRunning.ProductionBot;
        };
        localContent = localContent
            .replace("###BuildName###", DetailedDisplay ? prod["name"]:count + "x " + prod["name"])
            .replace("###ProdName###", prodName)
            .replace("###ProdState###", s)
            .replace("###id###", key)
        tableProductionList = tableProductionList.replace("###Building###", localContent);
    }
}
function cbwDomReady() {
    let filePath = path.join(asarPath, 'js', 'preloadLogin.js');
    var content = fs.readFileSync(filePath, 'utf8');
    store.set("UserName", UserName);
    store.set("Password", Password);
    let name = encodeURIComponent(UserName);
    let pass = encodeURIComponent(Password);
    FoBCore.debug(`setting Username, Password, WorldServer (${WorldServer}) & XSRF-Token`);
    content = content.replace(/###XSRF-TOKEN###/g, UserIDs.XSRF).replace(/###USERNAME###/g, name).replace(/###PASSWORD###/g, pass).replace(/###WorldServer###/g, WorldServer);
    Lwin.webContents.executeJavaScript(`${content}`);
}
function createBrowserWindow(url) {
    FoBCore.debug(`Creating Browserwindow`);
    const win = new BrowserWindow({
        height: 600,
        width: 800
    });
    FoBCore.debug(`Hiding Browserwindow`);
    win.hide();
    FoBCore.debug(`loading ${url}`);
    win.loadURL(url);
    Lwin = win;
    //win.webContents.openDevTools();
    win.webContents.once('dom-ready', cbwDomReady);
    win.webContents.on("did-navigate-in-page", (e, url) => {
        if (stop) { stop = false; return; }
        let filePath = path.join(asarPath, 'js', 'preloadLoginWorld.js');
        var content = fs.readFileSync(filePath, 'utf8');
        FoBCore.debug(`setting WorldServer`);
        content = content.replace(/###WorldServer###/g, WorldServer);
        win.webContents.executeJavaScript(`${content}`, true).then((result) => {
            FoBCore.debug(`Got Players Worlds`);
            let parsed = JSON.parse(result);
            data = parsed["player_worlds"];
            let worlds = parsed["worlds"];
            FoBWorldParser.FillWorldList(worlds, false, data);
            if (undefined !== FoBWorldParser.Worlds) {
                Gwin.webContents.send('print', i18n("Login.ChooseWorld"));
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
                FoBCore.debug(`Let User choose World`);
                Gwin.webContents.send('chooseWorld', PlayableWorld);
                ipcMain.once('loadWorld', LoadWorld);
            }
        });
    });
}
function LoadWorld(e, data) {
    if (undefined !== PlayableWorld[data]) {
        FoBCore.debug(`World choosen: ${data} (${PlayableWorld[data]})`);
        store.set("LastWorld", data);
        store.set("PlayableWorld", PlayableWorld);
        Gwin.webContents.send('clear', "");
        let filePath = path.join(asarPath, 'js', 'preloadSelectWorld.js');
        var content = fs.readFileSync(filePath, 'utf8');
        FoBCore.debug(`login into world`);
        content = content.replace(/###WORLD_ID###/g, data).replace(/###WorldServer###/g, WorldServer)
        Lwin.webContents.executeJavaScript(`${content}`);
    }
}
function SwitchWorld(world) {
    FoBCore.debug(`switching to world ${world}`);
    store.set("LastWorld", world);
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
        Gwin.webContents.send('print', i18n("MainWindow.Executing") + command);
        Gwin.webContents.send('block', true);
        Gwin.webContents.send('clear', "");
        x[command]()
            .then(() => Gwin.webContents.send('block', false))
    } catch (e) {
        Gwin.webContents.send('print', i18n("MainWindow.CommandNotAvailable"));
        Gwin.webContents.send('block', false);
    }
}
function createBrowserWindowAuto(url) {
    FoBCore.debug(`Login automaticaly with existing Username and Password`);
    const win = new BrowserWindow({
        height: 600,
        width: 800
    });
    win.hide();
    win.loadURL(url);
    win.webContents.once('dom-ready', cbwDomReady);
    win.webContents.on("did-navigate-in-page", (e, url) => {
        if (stop) { stop = false; return; }
        Gwin.webContents.send('clear', "");
        let filePath = path.join(asarPath, 'js', 'preloadSelectWorld.js');
        var content = fs.readFileSync(filePath, 'utf8');
        FoBCore.debug(`setting WorldID (${LastWorld}) WorldServer (${WorldServer})`);
        content = content.replace(/###WORLD_ID###/g, LastWorld).replace(/###WorldServer###/g, WorldServer)
        win.webContents.executeJavaScript(`${content}`);
    });
    Lwin = win;
}
function SwitchProduction(element, id) {
    FoBCore.debug(`Switch Production: ${element.text}`);
    CurrentProduction.id = element.id;
    CurrentProduction.time = id;
    CurrentProduction.text = element.text;
    exports.CurrentProduction = CurrentProduction;
    BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
}
function SwitchGoodProduction(element, id) {
    FoBCore.debug(`Switch GoodProduction: ${element.text}`);
    CurrentGoodProduction.id = element.id;
    CurrentGoodProduction.time = id;
    CurrentGoodProduction.text = element.text;
    exports.CurrentGoodProduction = CurrentGoodProduction;
    BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
}
function BuildMenu(login, logout, functions, settings, quit, devtools) {
    FoBCore.debug(`Building Menu (Login: ${login !== null}, Logout: ${logout !== null}, Functions: ${functions !== null}, Settings: ${settings !== null}, Quit: ${quit !== null} , DevTools: ${devtools !== null})`);
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
                if (worldid === UserIDs.WID)
                    worlds.push({ label: (Worlds[worldid] !== undefined ? Worlds[worldid].name : worldid) + ` (${i18n("Menu.Settings.Current")})`, id: worldid, click: () => { return; } });
                else
                    worlds.push({ label: (Worlds[worldid] !== undefined ? Worlds[worldid].name : worldid), id: worldid, click: () => { SwitchWorld(worldid); } });
            }
        }
        if (processer.ProductionDict.length > 0) {
            var Options = FoBCore.getProductionOptions();
            for (const key in Options) {
                if (Options.hasOwnProperty(key)) {
                    const element = Options[key];
                    if (parseInt(key) === CurrentProduction.time)
                        productionOptions.push({ label: element.text + ` (${i18n("Menu.Settings.Current")})`, id: element.id, click: () => { return; } });
                    else
                        productionOptions.push({ label: element.text, id: element.id, click: () => { SwitchProduction(element, parseInt(key)); } });
                }
            }
        }
        if (processer.GoodProdDict.length > 0) {
            var Options = FoBCore.getGoodsProductionOptions();
            for (const key in Options) {
                if (Options.hasOwnProperty(key)) {
                    const element = Options[key];
                    if (parseInt(key) === CurrentGoodProduction.time)
                        goodproductionOptions.push({ label: element.text + ` (${i18n("Menu.Settings.Current")})`, id: element.id, click: () => { return; } });
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
        label: `${i18n("Menu.Login")}`,
        id: "login",
        click: () => clickDO()
    })
    menu.append(mitem);
}
function addLogout(menu) {
    mitem = new MenuItem({
        label: `${i18n("Menu.Logout")}`,
        id: "logout",
        click: () => DoLogout()
    })
    menu.append(mitem);
}
function addFunctions(menu) {
    var botItems = [];
    //Aid
    botItems.push({
        label: `${i18n("Menu.Functions.Aid")}`,
        id: "aid",
        submenu: [
            {
                label: `${i18n("Menu.Functions.AidFriends")}${FriendsDict.length > 0 ? "" : i18n("Menu.Functions.NoFriends")}`,
                id: "aidFriends",
                click: () => FriendsMoppelDict.length > 0 ? FoBFunctions.ExecuteMotivateFriends(Gwin, FriendsMoppelDict) : {}
            },
            {
                label: `${i18n("Menu.Functions.AidNeighbor")}${NeighborDict.length > 0 ? "" : i18n("Menu.Functions.NoNeighbors")}`,
                id: "aidNeighbors",
                click: () => NeighborMoppelDict.length > 0 ? FoBFunctions.ExecuteMotivateNeighbors(Gwin, NeighborMoppelDict) : {}
            },
            {
                label: `${i18n("Menu.Functions.AidMembers")}${ClanMemberDict.length > 0 ? "" : i18n("Menu.Functions.NoClan")}`,
                id: "aidMembers",
                click: () => ClanMemberMoppelDict.length > 0 ? FoBFunctions.ExecuteMotivateMember(Gwin, ClanMemberMoppelDict) : {}
            },
            {
                label: `${i18n("Menu.Functions.AidAll")}`,
                id: "aidAll",
                click: () => FoBFunctions.ExecuteMoppelAll(Gwin, FriendsMoppelDict, NeighborMoppelDict, ClanMemberMoppelDict)
            },
        ]
    });
    //Tavern
    botItems.push({
        label: i18n("Menu.Functions.Tavern"),
        id: "tavern",
        submenu: [
            {
                label: i18n("Menu.Functions.TavernVisit"),
                id: "prodBot",
                click: () => FoBFunctions.ExecuteVisitTavern(Gwin, FriendsDict)
            }
        ]
    });
    //Visit taverns and aid all
    botItems.push({
        label: i18n("Menu.Functions.TavernAndAid"),
        id: "tavernAndAid",
        click:  () => FoBFunctions.ExecuteMotivateAllAndVisitTavern(Gwin, FriendsMoppelDict, NeighborMoppelDict, ClanMemberMoppelDict, FriendsDict)
    });
    //Bots
    botItems.push({
        label: i18n("Menu.Functions.Bots"),
        id: "bots",
        submenu: [
            {
                label: i18n("Menu.Functions.SnipableLB"),
                id: "SearchSnipLG",
                click: () => FoBFunctions.ExecuteSnipLGs(Gwin, FriendsDict, NeighborDict)
            }
        ]
    });
    //Others
    botItems.push({
        label: i18n("Menu.Functions.UpdateList"),
        id: "UpdateList",
        click: () => GetData()
    });

    mitem = new MenuItem({
        label: i18n("Menu.Functions"),
        id: "functions",
        submenu: botItems
    });
    menu.append(mitem);
}
function addSettings(menu, worlds = null, prodOptions = null, goodProdOptions = null) {
    var worldItem = [];
    if (null !== prodOptions) {
        worldItem.push({
            label: i18n("Menu.Settings.SwitchProduction"),
            id: "SwitchProduction",
            submenu: prodOptions
        })
    }
    if (null !== goodProdOptions) {
        worldItem.push({
            label: i18n("Menu.Settings.SwitchGoodsProduction"),
            id: "SwitchGoodsProduction",
            submenu: goodProdOptions
        })
    }
    worldItem.push({
        label: i18n("Menu.Settings.SetTavernBotInterval"),
        id: "TavernbotIntervall",
        click: () => setTavernBotIntervall()
    });
    var bots = [];
    for (const bot in Settings) {
        if (Settings.hasOwnProperty(bot)) {
            bots.push({
                label: i18n("Menu.Settings.ToggleBots." + bot).replace("__bool__", Settings[bot]),
                id: "Settings_" + bot,
                click: () => {
                    Settings[bot] = !Settings[bot];
                    BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
                    store.set("Settings", Settings);
                }
            });
        }
    }
    worldItem.push({
        label: i18n("Menu.Settings.ToggleBots"),
        id: "TavernbotIntervall",
        submenu: bots
    });
    if (UserIDs.UID !== null) {
        worldItem.push({
            label: i18n("Menu.Settings.HideBigRoad").replace("__bool__", HideBigRoad), id: "hide_bigroad", click: () => {
                HideBigRoad = !HideBigRoad;
                BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
                PrepareInfoMenu();
                exports.HideBigRoad = HideBigRoad;
            }
        });
    }
    if (null !== worlds) {
        worldItem.push({
            label: i18n("Menu.Settings.SwitchWorlds"),
            id: "SwitchWorlds",
            submenu: worlds
        })
    }
    worldItem.push({ label: i18n("Menu.Settings.ClearAllData"), id: "ClearData", click: () => { clearStorage(true) } });

    var lng = [];
    for (const code in PossibleLanguage) {
        if (PossibleLanguage.hasOwnProperty(code)) {
            const name = PossibleLanguage[code];
            lng.push({
                label: name,
                id: "ChangeLanguageTo" + code,
                click: () => {
                    ChangeLanguage(code);
                    Gwin.reload();
                }
            });
        }
    }
    worldItem.push({ label: i18n("Menu.Settings.SwitchLanguage"), id: "ChangeLanguage", submenu: lng });

    var themes = []
    themes.push({
        label : `${i18n("Menu.Settings.LightMode")} ${DarkMode? "" : "(" +i18n("Menu.Settings.Current") + ")"}`,
        id: "LightTheme",
        click: () =>{
            Gwin.webContents.send('toggleOverlay', [true, i18n("Overlay.ChangingTheme")]);
            store.set("DarkMode", false);
            DarkMode = store.get("DarkMode")
            fs.readFile(path.join(asarPath, 'css', DarkMode? 'windowdark.css' : 'window.css'), "utf-8", function (error, data) {
                if (!error) {
                    var formatedData = data.replace(/\s{2,10}/g, ' ').trim()
                    windowCSS = formatedData;
                }
            });
            BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
            GetData();
        }
    })
    themes.push({
        label : `${i18n("Menu.Settings.DarkMode")} ${DarkMode? "(" +i18n("Menu.Settings.Current") + ")": ""}`,
        id: "DarkTheme",
        click: () =>{
            Gwin.webContents.send('toggleOverlay', [true, i18n("Overlay.ChangingTheme")]);
            store.set("DarkMode", true);
            DarkMode = store.get("DarkMode")
            fs.readFile(path.join(asarPath, 'css', DarkMode? 'windowdark.css' : 'window.css'), "utf-8", function (error, data) {
                if (!error) {
                    var formatedData = data.replace(/\s{2,10}/g, ' ').trim()
                    windowCSS = formatedData;
                }
            });
            BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
            GetData();
        }
    })
    worldItem.push({
        label: i18n("Menu.Settings.SelectTheme"),
        id: "SelectTheme",
        submenu : themes
    });
    var displayOptions = [];
    displayOptions.push({
        label : `${i18n("Menu.Settings.DisplayOptionsDetailed")} ${DetailedDisplay? "(" +i18n("Menu.Settings.Current") + ")" :""}`,
        id : "DisplayModeDetailed",
        click: () => {
            Gwin.webContents.send('toggleOverlay', [true, i18n("Overlay.ChangingDisplayOption")]);
            store.set("DetailedDisplay", true);
            DetailedDisplay = store.get("DetailedDisplay");
            BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
            GetData();
        } 
    })
    displayOptions.push({
        label : `${i18n("Menu.Settings.DisplayOptionsGrouped")} ${DetailedDisplay? "" : "(" +i18n("Menu.Settings.Current") + ")"}`,
        id : "DisplayModeGrouped",
        click: () => {
            Gwin.webContents.send('toggleOverlay', [true, i18n("Overlay.ChangingDisplayOption")]);
            store.set("DetailedDisplay", false);
            DetailedDisplay = store.get("DetailedDisplay");
            BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
            GetData();
        } 
    })
    
    worldItem.push({ 
        label: i18n("Menu.Settings.DisplayOptions"), 
        id: "DisplayMode",
        submenu : displayOptions
    });
    mitem = new MenuItem({
        label: i18n("Menu.Settings"),
        id: "settings",
        submenu: worldItem
    });
    menu.append(mitem);
}
function addQuit(menu) {
    mitem = new MenuItem({
        label: i18n("Menu.Quit"),
        id: "quit",
        click: () => app.quit()
    })
    menu.append(mitem);
}
function addDevTools(menu) {
    mitem = new MenuItem({
        label: i18n("Menu.DevTools"),
        id: "devtools",
        click: () => Gwin.webContents.openDevTools()
    })
    menu.append(mitem);
}
function setTavernBotIntervall() {
    prompt({
        title: i18n("Menu.TavernBotInterval"),
        label: i18n("Menu.TavernBotIntervalValue"),
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
function clearStorage() {
    UserIDs = {
        XSRF: null,
        CSRF: null,
        CID: null,
        WID: null,
        ForgeHX: null,
        UID: null,
    }
    UserName = null;
    Password = null;
    LastWorld = null;
    PlayableWorld = [];
    store.clear();
    Gwin.webContents.send('clear', "");
    store.set("Language", "de")
    FoBCore.debug(`Storage cleared`);
    BuildMenu(true, false, false, true, true, isDev);
    PrintServerSelection();

}
function SessionExpired() {
    FoBCore.debug(`Session Expired`);
    FoBCore.debug(`Stopping Bots`);
    FoBProductionBot.StopProductionBot();
    UserIDs.UID = null;
    FoBCore.debug(`Trying to Login again in 10 minutes`);
    setTimeout(() => {
        //RunningTime = moment.now();
        FoBCore.debug(`Trying to Login again`);
        clickDO();
    }, 1000 * 60 * 10);
}
function SetupIpcMain() {
    ipcMain.on('removeFriend', (e, data) => {
        FoBCore.debug(`Remove Freind: ${data}`);
        builder.RemoveFriend(data).then(() => {
            GetData(false);
            Gwin.webContents.send('toggleOverlay', [false, ""]);
        });
    });
    ipcMain.on('collectTavern', () => {
        FoBCore.debug(`Collect Tavern`);
        FoBFunctions.CollectTavern(Gwin);
    });
    ipcMain.on('startProduction', () => {
        FoBCore.debug(`Start Production`);
        FoBProductionBot.StartManuel(Gwin)
    });
    ipcMain.on('collectProduction', () => {
        FoBCore.debug(`Collect Production`);
        FoBProductionBot.CollectManuel();
    });
    ipcMain.on('cancelProduction', () => {
        FoBCore.debug(`Cancel Production`);
        //FoBFunctions.CancelProduction();
    });
    ipcMain.on('collectIncidents', () => {
        FoBCore.debug(`Collect Incidents`);
        FoBFunctions.ExecuteCollectRewards(Gwin)
    });
    ipcMain.on("setActiveTab", (e, data) => {
        SelectedTab = data;
    });
    ipcMain.on("DoProdBot", (e, d) => {
        FoBCore.debug(`Start/Stop Production Bot`);
        BotsRunning.ProductionBot = d;
        GetData();
    });
    ipcMain.on("CollectAndStart", (e, data) => {
        var start = data[0];
        BlockFinish = data[1];
        BlockProduction = data[2];
        Block = data[3];
        if (!BlockFinish && !BlockProduction) {
            if (!start) {
                if (FoBProductionBot.CollectManuel() !== undefined) {
                    FoBProductionBot.CollectManuel().then(() => {
                        BlockFinish = BlockProduction = Block = false;
                    }); 
                }else{
                    BlockFinish = BlockProduction = Block = false;
                }
            } else {
                FoBProductionBot.StartManuel().then(() => {
                    BlockFinish = BlockProduction = Block = false;
                });
            }
        } else {
            BlockFinish = BlockProduction = Block = false;
        }
    });
}
async function ChangeLanguage(sL) {
    FoBCore.debug(`Change Language to ${sL}`);
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
                    if (fs.existsSync(path.join(asarPath, 'js', 'i18n', lang + '.json'))) {
                        return fs.readFileSync(path.join(asarPath, 'js', 'i18n', lang + '.json'), "utf-8");
                    } else {
                        return {};
                    }
                })
        );
        for (let languageData of languageDatas) {
            languageData = languageData.replace(/\/\/Todo: Translate/g, '');
            i18n.translator.add(JSON.parse(languageData));
        }
        exports.i18n = i18n;
        FoBCore.debug(`Successfull changed Language to ${sL}`);
        store.set("Language", sL);
        Lng = sL;
        if (UserIDs.UID !== null) GetData();
        BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
    } catch (err) {
        FoBCore.debug(`i18n translation loading error ${err}`);
    }
}
function PrintServerSelection() {
    FoBCore.pWL(Gwin, app, false);
    Gwin.webContents.send('chooseServer', [i18n("Login.ChooseServer"), FoBCore.Servers]);
    ipcMain.once("loadServer", loadServer);
}
function loadServer(e, data) {
    if (undefined !== FoBCore.Servers[data]) {
        FoBCore.debug(`Server ${data} selected`);
        store.set("WorldServer", data);
        WorldServer = data;
        Gwin.webContents.send('clear', "");
        FoBCore.pWL(Gwin, app);
        Gwin.webContents.send('fillCommands', FoBCommands.getLoginCommands());
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
exports.i18n = i18n;