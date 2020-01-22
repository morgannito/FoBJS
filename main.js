const { app, BrowserWindow, session, screen, Menu, ipcMain, MenuItem } = require("electron");
const electronDl = require('electron-dl');
const fs = require('fs');
const path = require('path');
const proxy = require("./module/FoBProxy");
const builder = require("./module/FoBuilder");
const processer = require("./module/FoBProccess");
const FoBCore = require("./module/FoBCore");
const FoBFunctions = require("./module/FoBFunctions");

electronDl();

var Gwin = null;
var menu = null;
var loginMenu = null;
var VS = null;
var Lwin = null;
var UserIDs = {
    XSRF: null,
    CSRF: null,
    CID: null,
    SID: null,
    UID: null,
    WID: null,
}
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
    })

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
    if (null === proxy.UID) {
        createBrowserWindow("https://de.forgeofempires.com/");
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
            menu.insert(insertBefore,mitem);
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
    let filePath = path.join(app.getPath("cache"), '.', 'ForgeHX-2683b67a.js');
    if (!fs.existsSync(filePath)) {
        Gwin.webContents.send('info', "Searching cached ForgeHX.js");
        await electronDl.download(Gwin, "https://foede.innogamescdn.com//cache/ForgeHX-2683b67a.js", { directory: app.getPath("cache") });
        Gwin.webContents.send('info', "ForgeHX.js cached");
    }

    let content = fs.readFileSync(filePath, 'utf8');
    if (content.length === 0) return;

    let re = /.VERSION_SECRET="([a-zA-Z0-9_\-\+\/==]+)";/ig;
    re = new RegExp(re);
    let result = content.matchAll(re).next().value;
    if (null !== result) {
        if (result.length === 2) {
            //Gwin.webContents.send('print', "VERSION_SECRET found (" + result[1] + ")");
            VS = result[1];
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
    }
    await session.defaultSession.clearStorageData();
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
                    AddButton({text: "Alle Moppeln", id: "function",  menu: loginMenu, callback:() => { FoBFunctions.ExecuteMoppelAll(Gwin, FriendsDict, NeighborDict, ClanMemberDict) }});
                    AddButton({text: "Alle Besuchen", id: "function",  menu: loginMenu, callback:() => { FoBFunctions.ExecuteVisitTavern(Gwin, FriendsDict) }});
                    AddButton({text: "Update Lists", id: "function",  menu: loginMenu,callback: () => { GetData() }});
                    Lwin.destroy();
                    Gwin.webContents.send('print', "init RequestBuilder");
                    builder.init(UserIDs.UID, VS, UserIDs.WID);
                    GetData();
                }
            });
        }
    }
});

function GetData() {
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
                                    //Gwin.webContents.send('print', "Possible Tavernvisits: " + processer.GetVisitableTavern(processer.FriendsDict).length);
                                    Gwin.webContents.send('clear', "");
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
    win.loadURL(url);
    Lwin = win;
}