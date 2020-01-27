const { app, BrowserWindow, session, screen, Menu, ipcMain, MenuItem } = require("electron");
const electronDl = require('electron-dl');
const fs = require('fs');
const path = require('path');
const storage = require('electron-json-storage');
const proxy = require("./module/FoBProxy");
const builder = require("./module/FoBuilder");
const processer = require("./module/FoBProccess");
const FoBCore = require("./module/FoBCore");
const FoBFunctions = require("./module/FoBFunctions");
const FoBCommands = require("./module/FoBCommands");

electronDl();

storage.setDataPath(path.join(app.getPath("userData")));

storage.getAll((err, data) => {
    if (err) throw error;
    if (!(Object.entries(data).length === 0) && data.constructor === Object) {
        UserName = data["UserName"];
        Password = data["Password"];
        LastWorld = data["LastWorld"];
    }
});

var Gwin = null;
var menu = null;
var loginMenu = null;
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

var stop = true;

var NeighborDict = [];
var FriendsDict = [];
var ClanMemberDict = [];

function createWindow() {

    const size = screen.getAllDisplays()[0].workAreaSize;
    let win = new BrowserWindow({
        title: "FoB v" + app.getVersion(),
        width: size[0],
        height: size[1],
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            allowRunningInsecureContent: true
        }
    });
    Gwin = win;

    Gwin.loadFile('html/index.html');

    proxy.init();

    createMenu();

    ipcMain.on('loaded', () => {
        FoBCore.pWL(Gwin, app, () => createMenuLogin());
        Gwin.webContents.send('fillCommands', FoBCommands.getLoginCommands());
    });

    ipcMain.on('executeCommand', (e, data) => {
        assocFunction(data)
    });

    Gwin.on('closed', () => {
        Gwin, win = null
    })

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
    if (null === proxy.UID && UserName !== null && Password !== null) {
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
function createMenu() {
    const menuTempate = [
        {
            label: 'DevTools',
            click: () => {
                Gwin.webContents.openDevTools();
            }
        },
        {
            label: 'Quit',
            click: () => {
                app.quit();
            }
        }
    ];

    menu = Menu.buildFromTemplate(menuTempate);
    Menu.setApplicationMenu(menu);
}
function createMenuLogin() {
    const menuTempate = [{
        label: 'Login',
        click: () => {
            clickDO();
        }
    },
    {
        label: 'DevTools',
        click: () => {
            Gwin.webContents.openDevTools();
        }
    },
    {
        label: 'Quit',
        click: () => {
            app.quit();
        }
    }
    ];

    loginMenu = Menu.buildFromTemplate(menuTempate);
    Menu.setApplicationMenu(loginMenu);
}
function createMenuLoggedIn() {
    const menuTempate = [{
        label: 'Logout',
        click: () => {
            DoLogout();
        }
    },
    {
        label: 'DevTools',
        click: () => {
            Gwin.webContents.openDevTools();
        }
    },
    {
        label: 'Quit',
        click: () => {
            app.quit();
        }
    }
    ];

    menu = Menu.buildFromTemplate(menuTempate);
    Menu.setApplicationMenu(menu);
}
function AddButton({ text = "default", id = "none", insertBefore = null, menu = null, callback = null }) {
    menu = Menu.getApplicationMenu();
    if (null === callback) {
        mitem = new MenuItem({
            label: text,
            id: id,
            submenu: []
        });
        if (insertBefore !== null)
            menu.insert(insertBefore, mitem);
        else
            menu.append(mitem);
        Menu.setApplicationMenu(menu);
    } else {
        let item = menu.getMenuItemById(id);
        mitem = new MenuItem({
            label: text,
            id: id + "_" + text,
            click: () => callback()
        })
        item.submenu.append(mitem);
        Menu.setApplicationMenu(menu);
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
    //await session.defaultSession.clearStorageData();
    createMenuLogin();
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
                    createMenuLoggedIn();
                    AddButton({ text: "Funktionen", id: "function", menu: loginMenu, insertBefore: 2 });
                    AddButton({ text: "Alle Moppeln", id: "function", menu: loginMenu, callback: () => { FoBFunctions.ExecuteMoppelAll(Gwin, FriendsDict, NeighborDict, ClanMemberDict) } });
                    AddButton({ text: "Alle Besuchen", id: "function", menu: loginMenu, callback: () => { FoBFunctions.ExecuteVisitTavern(Gwin, FriendsDict) } });
                    AddButton({ text: "Update Lists", id: "function", menu: loginMenu, callback: () => { GetData() } });
                    Gwin.webContents.send('fillCommands', FoBCommands.getAllCommands());
                    Lwin.destroy();
                    Gwin.webContents.send('print', "init RequestBuilder");
                    builder.init(UserIDs.UID, VS, VMM, UserIDs.WID);
                    GetData();
                }
            });
        }
    }
});

function GetData(clear = true) {
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
                                    processer.GetTavernInfo(body);
                                    FoBFunctions.ArcBonus = processer.GetArcBonus(body);
                                    //Gwin.webContents.send('print', "Possible Tavernvisits: " + processer.GetVisitableTavern(processer.FriendsDict).length);
                                    if (clear) Gwin.webContents.send('clear', "");
                                    PrepareInfoMenu();

                                });
                        });
                });
        });
}
function PrepareInfoMenu() {
    h = [];
    h.push("<span>#######################################################</span><br>");
    h.push("<span># Usefull Information: </span><br>");
    h.push("<span>#                                                     </span><br>");
    h.push(`<span># Friends: ${FriendsDict.length}                                           </span><br>`);
    h.push(`<span># Clanmembers: ${ClanMemberDict.length}                                           </span><br>`);
    h.push(`<span># Neighbors: ${NeighborDict.length}                                           </span><br>`);
    h.push(`<span>#                                                     </span><br>`);
    h.push(`<span># Tavern you can visit: ${processer.GetVisitableTavern(FriendsDict).length}                                           </span><br>`);
    h.push("<span>#                                                     </span><br>");
    h.push("<span>#######################################################</span><br>");
    FoBCore.printInfo(Gwin, h);
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
        let filePath = path.join('js', 'preloadLogin.js');
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
        let filePath = path.join('js', 'preloadLoginWorld.js');
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
                        Gwin.webContents.send('clear', "");
                        let filePath = path.join('js', 'preloadSelectWorld.js');
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
function assocFunction(command) {
    var x = {
        'Login': async () => { return clickDO(); }
    }
    if (UserIDs.UID !== null)
        x = {
            ...x,
            'Logout': async () => { return DoLogout(); },
            'MoppleAll': async () => { return FoBFunctions.ExecuteMoppelAll(Gwin, FriendsDict, NeighborDict, ClanMemberDict); },
            'VisitAll': async () => { return FoBFunctions.ExecuteVisitTavern(Gwin, FriendsDict); },
            'UpdateList': async () => { return GetData(); },
            'SearchSnipLG': async () => { return FoBFunctions.ExecuteSnipLGs(Gwin, FriendsDict, NeighborDict); }
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
        let filePath = path.join('js', 'preloadLogin.js');
        var content = fs.readFileSync(filePath, 'utf8');
        let name = encodeURIComponent(UserName);
        let pass = encodeURIComponent(Password);
        content = content.replace("###XSRF-TOKEN###", UserIDs.XSRF).replace("###USERNAME###", name).replace("###PASSWORD###", pass);
        win.webContents.executeJavaScript(`${content}`);
    });
    win.webContents.on("did-navigate-in-page", (e, url) => {
        if (stop) { stop = false; return; }
        Gwin.webContents.send('clear', "");
        let filePath = path.join('js', 'preloadSelectWorld.js');
        var content = fs.readFileSync(filePath, 'utf8');
        content = content.replace("###WORLD_ID###", LastWorld);
        win.webContents.executeJavaScript(`${content}`);
    });
    Lwin = win;
}
exports.GetData = GetData;