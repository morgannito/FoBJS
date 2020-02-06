const { app, BrowserWindow, session, screen, Menu, ipcMain, MenuItem } = require("electron");
const electronDl = require('electron-dl');
const fs = require('fs');
const path = require('path');
const fetch = require('electron-fetch').default;
const cTable = require('console.table');
const moment = require('moment');
const storage = require('electron-json-storage');
const proxy = require("./module/FoBProxy");
const builder = require("./module/FoBuilder");
const processer = require("./module/FoBProccess");
const FoBCore = require("./module/FoBCore");
const FoBFunctions = require("./module/FoBFunctions");
const FoBCommands = require("./module/FoBCommands");
const FoBProductionBot = require("./module/FoBProductionBot");

const timer = require("./js/timer").timer;

const asarPath = path.join(app.getAppPath());

electronDl();

storage.setDataPath(path.join(app.getPath("userData")));

storage.getAll((err, data) => {
    if (err) throw error;
    if (!(Object.entries(data).length === 0) && data.constructor === Object) {
        UserName = data["UserName"];
        Password = data["Password"];
        LastWorld = data["LastWorld"];
        PlayableWorld = data["PlayableWorld"];
    }
});

moment.locale("de");
moment.relativeTimeThreshold("ss", 10);
moment.relativeTimeThreshold("s", 11);
moment.relativeTimeThreshold("m", 59);
moment.relativeTimeThreshold("h", 59);
moment.relativeTimeThreshold("d", 24);

let isDev = true;

const eState = { Producing: 1, Idle: 2, Finished: 3 };

var Gwin = null;
var menu = null;
var VS = null;
var VMM = null;
var Lwin = null,
    UserName = null,
    Password = null,
    LastWorld = null,
    PlayableWorld = [];
var UserIDs = {
    XSRF: null,
    CSRF: null,
    CID: null,
    SID: null,
    UID: null,
    WID: null,
    ForgeHX: null,
}
var UserData = {};
var stop = true;
var NeighborDict = [];
var FriendsDict = [];
var ClanMemberDict = [];
var UpdateInfoID = null;
var RefreshInfoID = null;
var UpdateList = false;
var HideBigRoad = true;
var CurrentProduction = { time: 5, id: 1, text: "5min" };

function createWindow() {
    let win = new BrowserWindow({
        title: "FoB v" + app.getVersion(),
        width: 805,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            allowRunningInsecureContent: true
        }
    });
    Gwin = win;

    Gwin.loadFile(path.join(asarPath,"html","index.html"));

    proxy.init();

    BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);

    ipcMain.on('loaded', () => {
        FoBCore.pWL(Gwin, app);
        Gwin.webContents.send('fillCommands', FoBCommands.getLoginCommands());
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

    Gwin.on('closed', () => {
        Gwin, win = null
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
    if (null === UserIDs.UID && UserName !== null && Password !== null) {
        createBrowserWindowAuto("https://de.forgeofempires.com/");
    } else {
        Gwin.webContents.send('requestUsername', "Please enter your Username: ");
        ipcMain.once('getUsername', (event, data) => {
            if ("" !== data) {
                UserName = data;
                Gwin.webContents.send('requestPassword', "Please enter your Password: ");
                ipcMain.once('getPassword', (event, data) => {
                    if ("" !== data) {
                        Password = data;
                        createBrowserWindow("https://de.forgeofempires.com/");
                    }
                });
            }
        });
    }
}
async function downloadForgeHX() {
    let filePath = path.join(app.getPath("cache"), '.', UserIDs.ForgeHX);
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
    storage.remove("UserName");
    storage.remove("Password");
    storage.remove("LastWorld");
    storage.remove("PlayableWorld");
    //await session.defaultSession.clearStorageData();
    BuildMenu(true, false, false, true, true, isDev);
    FoBCore.pWL(Gwin, app);
    Gwin.webContents.send('clearInfoMenu', "");
}
proxy.emitter.on("SID_Loaded", data => {
    if (UserIDs.SID === null || UserIDs.SID !== data) {
        //Gwin.webContents.send('print', "SID_Loaded: " + data);
        if (null !== data)
            UserIDs.SID = data;
    }
});
proxy.emitter.on("XSRF_Loaded", (data) => {
    if (UserIDs.XSRF === null || UserIDs.XSRF !== data) {
        //Gwin.webContents.send('print', "XSRF_Loaded: " + data);
        if (null !== data)
            UserIDs.XSRF = data;
    }
});
proxy.emitter.on("CSRF_Loaded", data => {
    if (UserIDs.CSRF === null || UserIDs.CSRF !== data) {
        //Gwin.webContents.send('print', "CSRF_Loaded: " + data);
        if (null !== data)
            UserIDs.CSRF = data;
    }
});
proxy.emitter.on("CID_Loaded", data => {
    if (UserIDs.CID === null || UserIDs.CID !== data) {
        //Gwin.webContents.send('print', "CID_Loaded: " + data);
        if (null !== data)
            UserIDs.CID = data;
    }
});
proxy.emitter.on("ForgeHX_Loaded", data => {
    if (UserIDs.ForgeHX === null || UserIDs.ForgeHX !== data) {
        if (null !== data)
            UserIDs.ForgeHX = data;
    }
});
proxy.emitter.on("WID_Loaded", data => {
    if (UserIDs.WID === null || UserIDs.WID !== data) {
        //Gwin.webContents.send('print', "WID_Loaded: " + data);
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
                    Gwin.webContents.send('fillCommands', FoBCommands.getAllCommands());
                    Lwin.destroy();
                    Gwin.webContents.send('print', "init RequestBuilder");
                    builder.init(UserIDs.UID, VS, VMM, UserIDs.WID);
                    GetData(true, () => {
                        BuildMenu((UserIDs.UID === null), (UserIDs.UID !== null), (UserIDs.UID !== null), true, true, isDev);
                    });
                    if (UpdateInfoID === null) {
                        timer.start(() => {
                            GetData(false);
                            timer.set_interval(FoBCore.getRandomInt((1000 * 60), (1000 * 90)));
                        }, FoBCore.getRandomInt((1000 * 60), (1000 * 90)));
                        UpdateInfoID = timer.timeout;
                    }
                    if(RefreshInfoID === null){
                        timer.start(()=>{
                            PrepareInfoMenu();
                            if(UpdateList){
                                GetData(false);
                                UpdateList = false;
                            }
                        }, 999);
                        RefreshInfoID = timer.timeout;
                    }
                }
            });
        }
    }
});
FoBProductionBot.emitter.on("TimeUpdate", data => {
    FinishTime = data
});
FoBProductionBot.emitter.on("UpdateMenu", data => {
    PrepareInfoMenu();
});

function GetData(clear = true, callback = null) {
    processer.clearLists();
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
                                    builder.GetMetaDataUrls(body).then(jsonbody => {
                                        if (jsonbody !== null) {
                                            processer.GetAllBuildings(jsonbody);
                                            processer.GetOwnBuildings();
                                            processer.GetDistinctProductList();
                                            if (clear) Gwin.webContents.send('clear', "");
                                            PrepareInfoMenu();
                                            if (callback !== null) {
                                                callback();
                                            }
                                        }
                                    });
                                    //Gwin.webContents.send('print', "Possible Tavernvisits: " + processer.GetVisitableTavern(processer.FriendsDict).length);
                                });
                        });
                });
        });
}
function PrepareInfoMenu() {

    var s = "";
    if (processer.OwnTavernInfo[1] === processer.OwnTavernInfo[2])
        s = "full";
    else s = "sitting"

    let filePath = path.join(asarPath,'html', 'table.html');
    var tableContent = fs.readFileSync(filePath, 'utf8');
    filePath = path.join(asarPath,'html', 'building.html');
    var buildContent = fs.readFileSync(filePath, 'utf8');

    var dProdList = processer.DProductionDict;
    var dResList = processer.DResidentialDict;

    var dList = dProdList.concat(dResList);

    tableContent = tableContent
        .replace("###CurWorld###", UserIDs.WID)
        .replace("###Friends###", FriendsDict.length)
        .replace("###Clan###", ClanMemberDict.length)
        .replace("###Neighbor###", NeighborDict.length)
        .replace("###Visitable###", processer.GetVisitableTavern(FriendsDict).length)
        .replace("###State###", `${processer.OwnTavernInfo[2]}/${processer.OwnTavernInfo[1]} ${s}`)
        .replace("###SupplyName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "supplies") }).name}`)
        .replace("###MoneyName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "money") }).name}`)
        .replace("###SupplyAmount###", `${processer.ResourceDict.supplies}`)
        .replace("###MoneyAmount###", `${processer.ResourceDict.money}`)
        .replace("###TavernSilverName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "tavern_silver") }).name}`)
        .replace("###TavernSilverAmount###", `${processer.ResourceDict.tavern_silver}`)
        .replace("###DiaName###", `${processer.ResourceDefinitions.find((v, i, r) => { return (v.id === "premium") }).name}`)
        .replace("###DiaAmount###", `${processer.ResourceDict.premium}`)
        .replace("###PlayerName###", `${UserData.UserName}`)

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
    if (visHidden.length <= 4) {
        for (let i = 0; i < 4; i++) {
            const e = visHidden[i];
            if (undefined === e || null === e)
                tableContent = tableContent
                    .replace("###IncRare" + i + "###", "")
                    .replace("###IncLoc" + i + "###", "")
            else
                tableContent = tableContent
                    .replace("###IncRare" + i + "###", e.rarity)
                    .replace("###IncLoc" + i + "###", e.position)
        }

        for (let key in dList) {
            if (!dList.hasOwnProperty(key)) return;
            var localContent = buildContent;
            var prod = dList[key].res === undefined ? dList[key].prod : dList[key].res;
            var count = dList[key].count;

            var prodName = "idle";
            var production = "";
            if (prod["state"]["__class__"] === "ProducingState") {
                var end = moment.unix(prod["state"]["next_state_transition_at"]);
                var start = moment.unix(Math.round(new Date().getTime() / 1000));
                if(start.isAfter(end)) UpdateList = true;
                var dur = moment.duration(end.diff(start));
                s = `in ${(!dur.hours() ? (!dur.minutes() ? dur.seconds() + "sec" : dur.minutes() + "min " + dur.seconds() + "sec") : dur.hours() + "h " + dur.minutes() + "min " + dur.seconds() + "sec")}`;
                production = Object.keys(prod["state"]["current_product"]["product"]["resources"])[0];
                prodName = count + "x " + prod["state"]["current_product"]["product"]["resources"][production] + " " + processer.ResourceDefinitions.find((v) => { return (v["id"] === production); })["name"] + ` (${count * prod["state"]["current_product"]["product"]["resources"][production]})`;
            }
            else if (prod["state"]["__class__"] === "IdleState") s = "idle"
            else if (prod["state"]["__class__"] === "ProductionFinishedState") {
                s = "finished";
                production = Object.keys(prod["state"]["current_product"]["product"]["resources"])[0];
                prodName = count + "x " + prod["state"]["current_product"]["product"]["resources"][production] + " " + processer.ResourceDefinitions.find((v) => { return (v["id"] === production); })["name"] + ` (${count * prod["state"]["current_product"]["product"]["resources"][production]})`;
            };

            localContent = localContent
                .replace("###BuildName###", count + "x " + prod["name"])
                .replace("###ProdName###", prodName)
                .replace("###ProdState###", s)
                .replace("###IncRareX###", "")
                .replace("###IncLocX###", "")
            tableContent = tableContent.replace("###BuildingIncident###", localContent + "\n\r###BuildingIncident###");
        }
        tableContent = tableContent.replace("###BuildingIncident###", "");
    } else {
        var prodLength = dList.length;
        var HiddenLength = visHidden.length;
        for (let i = 0; i < 4; i++) {
            const e = visHidden[i];
            if (undefined === e || null === e)
                tableContent = tableContent
                    .replace("###IncRare" + i + "###", "")
                    .replace("###IncLoc" + i + "###", "")
            else
                tableContent = tableContent
                    .replace("###IncRare" + i + "###", e.rarity)
                    .replace("###IncLoc" + i + "###", e.position)

            visHidden = visHidden.filter((reward) => { return (reward.id !== e.id); });
        }
        HiddenLength = visHidden.length;
        var maxLength = (HiddenLength > prodLength) ? HiddenLength : prodLength;
        for (let i = 0; i < maxLength; i++) {
            var localContent = buildContent;
            const Hidden = visHidden[i];
            var prod = dList[i].res === undefined ? dList[i].prod : dList[i].res;
            var count = dList[i].count;

            if (undefined === Hidden || null === Hidden) {
                localContent = localContent
                    .replace("###IncRareX###", "")
                    .replace("###IncLocX###", "");
            } else {
                localContent = localContent
                    .replace("###IncRareX###", Hidden.rarity)
                    .replace("###IncLocX###", Hidden.position)
            }

            if (undefined === prod || null === prod) {
                localContent = localContent
                    .replace("###BuildName###", "")
                    .replace("###ProdName###", "")
                    .replace("###ProdState###", "")
            } else {
                var prodName = "idle";
                var production = "";
                if (prod["state"]["__class__"] === "ProducingState") {
                    var end = moment.unix(prod["state"]["next_state_transition_at"]);
                    var start = moment.unix(Math.round(new Date().getTime() / 1000));
                    if(start.isAfter(end)) UpdateList = true;
                    var dur = moment.duration(end.diff(start));
                    s = `in ${(!dur.hours() ? (!dur.minutes() ? dur.seconds() + "sec" : dur.minutes() + "min " + dur.seconds() + "sec") : dur.hours() + "h " + dur.minutes() + "min " + dur.seconds() + "sec")}`;
                    production = Object.keys(prod["state"]["current_product"]["product"]["resources"])[0];
                    prodName = count + "x " + prod["state"]["current_product"]["product"]["resources"][production] + " " + processer.ResourceDefinitions.find((v) => { return (v["id"] === production); })["name"] + ` (${count * prod["state"]["current_product"]["product"]["resources"][production]})`;
                }
                else if (prod["state"]["__class__"] === "IdleState") s = count + "x " + "idle"
                else if (prod["state"]["__class__"] === "ProductionFinishedState") {
                    s = "finished";
                    production = Object.keys(prod["state"]["current_product"]["product"]["resources"])[0];
                    prodName = count + "x " + prod["state"]["current_product"]["product"]["resources"][production] + " " + processer.ResourceDefinitions.find((v) => { return (v["id"] === production); })["name"] + ` (${count * prod["state"]["current_product"]["product"]["resources"][production]})`;
                };

                localContent = localContent
                    .replace("###BuildName###", prod["name"])
                    .replace("###ProdName###", prodName)
                    .replace("###ProdState###", s)
            }
            tableContent = tableContent.replace("###BuildingIncident###", localContent + "\n\r ###BuildingIncident###");
        }
        tableContent = tableContent.replace("###BuildingIncident###", "");
    }
    FoBCore.printInfo(Gwin, tableContent);
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
        let filePath = path.join(asarPath,'js', 'preloadLogin.js');
        console.log(filePath);
        var content = fs.readFileSync(filePath, 'utf8');
        storage.set("UserName", UserName);
        storage.set("Password", Password);
        let name = encodeURIComponent(UserName);
        let pass = encodeURIComponent(Password);
        content = content.replace("###XSRF-TOKEN###", UserIDs.XSRF).replace("###USERNAME###", name).replace("###PASSWORD###", pass);
        win.webContents.executeJavaScript(`${content}`);
    });
    win.webContents.on("did-navigate-in-page", (e, url) => {
        if (stop) { stop = false; return; }
        let filePath = path.join(asarPath,'js', 'preloadLoginWorld.js');
        var content = fs.readFileSync(filePath, 'utf8');
        win.webContents.executeJavaScript(`${content}`, true).then((result) => {
            data = JSON.parse(result)["player_worlds"];
            if ("" !== data) {
                Gwin.webContents.send('print', "Choose from one of yours Worlds: ");
                var possWorlds = "";
                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        Gwin.webContents.send('print', `${data[key] + 1}: ${key}`);
                        possWorlds += `${key},`
                    }
                }
                PlayableWorld = possWorlds.slice(0, -1).split(',');
                Gwin.webContents.send('chooseWorld', possWorlds);
                ipcMain.once('loadWorld', (event, data) => {
                    if (undefined !== PlayableWorld[data]) {
                        storage.set("LastWorld", PlayableWorld[data]);
                        storage.set("PlayableWorld", PlayableWorld);
                        Gwin.webContents.send('clear', "");
                        let filePath = path.join(asarPath,'js', 'preloadSelectWorld.js');
                        var content = fs.readFileSync(filePath, 'utf8');
                        content = content.replace("###WORLD_ID###", PlayableWorld[data]);
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
    if (UserIDs.UID !== null)
        x = {
            ...x,
            'Logout': async () => { return DoLogout(); },
            'MoppleAll': async () => { return FoBFunctions.ExecuteMoppelAll(Gwin, FriendsDict, NeighborDict, ClanMemberDict); },
            'VisitAll': async () => { return FoBFunctions.ExecuteVisitTavern(Gwin, FriendsDict); },
            'SearchSnipLG': async () => { return FoBFunctions.ExecuteSnipLGs(Gwin, FriendsDict, NeighborDict); },
            'StartProductionBot': async () => { return FoBProductionBot.StartProductionBot(); }, // 
            'CollectSelf': async () => { return FoBProductionBot.CollectManuel(Gwin); }, // 
            'QueueSelf': async () => { return FoBProductionBot.StartManuel(Gwin); }, // 
            'CollectIncidnet': async () => { return FoBFunctions.ExecuteCollectRewards(Gwin); },
            'CollectTavern': async () => { return FoBFunctions.CollectTavern(Gwin); },
            'UpdateList': async () => { return GetData(); },
            'SwitchWorlds': async () => { return SwitchWorld(); }
        };
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
    //win.webContents.openDevTools();
    win.webContents.once('dom-ready', () => {
        let filePath = path.join(asarPath,'js', 'preloadLogin.js');
        console.log(filePath);
        var content = fs.readFileSync(filePath, 'utf8');
        let name = encodeURIComponent(UserName);
        let pass = encodeURIComponent(Password);
        content = content.replace("###XSRF-TOKEN###", UserIDs.XSRF).replace("###USERNAME###", name).replace("###PASSWORD###", pass);
        win.webContents.executeJavaScript(`${content}`);
    });
    win.webContents.on("did-navigate-in-page", (e, url) => {
        if (stop) { stop = false; return; }
        Gwin.webContents.send('clear', "");
        let filePath = path.join(asarPath,'js', 'preloadSelectWorld.js');
        var content = fs.readFileSync(filePath, 'utf8');
        content = content.replace("###WORLD_ID###", LastWorld);
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
function BuildMenu(login, logout, functions, settings, quit, devtools) {
    worlds = [];
    productionOptions = [];
    Menu.setApplicationMenu(new Menu());
    menu = Menu.getApplicationMenu();

    if (login) addLogin(menu);
    if (logout) addLogout(menu);
    if (functions) addFunctions(menu);
    if (!login && settings) {
        if (PlayableWorld.length > 0) {
            PlayableWorld.forEach(world => {
                if (world === UserIDs.WID)
                    worlds.push({ label: world + " (Current)", id: world, click: () => { return; } });
                else
                    worlds.push({ label: world, id: world, click: () => { SwitchWorld(world); } });
            });
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
        addSettings(menu, worlds, productionOptions);
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
    mitem = new MenuItem({
        label: "Functions",
        id: "functions",
        submenu: [
            {
                label: "Alle Moppeln",
                id: "MoppleAll",
                click: () => FoBFunctions.ExecuteMoppelAll(Gwin, FriendsDict, NeighborDict, ClanMemberDict)
            },
            {
                label: "Alle Besuchen",
                id: "VisitAll",
                click: () => FoBFunctions.ExecuteVisitTavern(Gwin, FriendsDict)
            },
            {
                label: "Starte Produktions-Bot",
                id: "StartProductionBot",
                click: () => FoBProductionBot.StartProductionBot()
            },
            {
                label: "Suche snippbare LGs",
                id: "SearchSnipLG",
                click: () => FoBFunctions.ExecuteSnipLGs(Gwin, FriendsDict, NeighborDict)
            },
            {
                label: "Selbst Einsammeln",
                id: "CollectSelf",
                click: () => FoBProductionBot.CollectManuel(Gwin)
            },
            {
                label: "Selbst Starten",
                id: "QueueSelf",
                click: () => FoBProductionBot.StartManuel(Gwin)
            }, {
                label: "Incident einsammeln",
                id: "CollectIncident",
                click: () => FoBFunctions.ExecuteCollectRewards(Gwin)
            },
            {
                label: "Taverne einsammeln",
                id: "CollectTavern",
                click: () => FoBFunctions.CollectTavern(Gwin)
            },
            {
                label: "Update Lists",
                id: "UpdateList",
                click: () => GetData()
            }

        ]
    });
    menu.append(mitem);
}
function addSettings(menu, worlds = null, prodOptions = null) {
    var worldItem = [];
    if (null !== prodOptions) {
        worldItem.push({
            label: "Switch Production",
            id: "SwitchProduction",
            submenu: prodOptions
        })
    }
    worldItem.push({ label: "Set min Intervall", id: "MinIntervall" });
    worldItem.push({ label: "Set max Intervall", id: "MaxIntervall" });
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
function clearStorage() {
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
    storage.clear(() => {
        Gwin.webContents.send('print', "Userdata was cleared!");
    });
}

exports.GetData = GetData;
exports.eState = eState;
exports.HideBigRoad = HideBigRoad;
exports.CurrentProduction = CurrentProduction;