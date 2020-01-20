const { app, BrowserWindow, session, screen, Menu, ipcMain, MenuItem } = require("electron");
const electronDl = require('electron-dl');
const fs = require('fs');
const path = require('path');
const proxy = require("./module/FoBProxy");
const builder = require("./module/FoBuilder");
const processer = require("./module/FoBProccess");

electronDl();

var Gwin = null;
var menu = null;
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

function createWindow() {
    const size = screen.getAllDisplays()[0].workAreaSize;
    let win = new BrowserWindow({
        width: size[0],
        height: size[1],
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            allowRunningInsecureContent: true
        }
    });
    Gwin = win;
    win.loadFile('html/index.html');

    proxy.init();

    createMenuLogin();
    win.on('closed', () => {
        win = null
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
function createMenuLogin() {
    const menuTempate = [
        {
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

    menu = Menu.buildFromTemplate(menuTempate);
    Menu.setApplicationMenu(menu);
}
function createMenuLoggedIn() {
    const menuTempate = [
        {
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
function AddButton(text, id, callback = null) {
    menu = Menu.getApplicationMenu();
    if (null === callback) {
        mitem = new MenuItem({
            label: text,
            id: id,
            submenu: []
        });
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
    if (!fs.existsSync(filePath))
        await electronDl.download(Gwin, "https://foede.innogamescdn.com//cache/ForgeHX-2683b67a.js", { directory: app.getPath("cache") });

    let content = fs.readFileSync(filePath, 'utf8');
    if (content.length === 0) return;

    let re = /.VERSION_SECRET="([a-zA-Z0-9_\-\+\/==]+)";/ig;
    re = new RegExp(re);
    let result = content.matchAll(re).next().value;
    if (null !== result) {
        if (result.length === 2)
            VS = result[1];
        else
            console.log("ERROR");
    }
}
function DoLogout() {
    session.defaultSession.clearAuthCache();
    session.defaultSession.clearCache();
    session.defaultSession.clearHostResolverCache();
    session.defaultSession.clearStorageData();
}

proxy.emitter.on("SID_Loaded", data => {
    if (null !== data)
        UserIDs.SID = data;
});

proxy.emitter.on("XSRF_Loaded", (data) => {
    if (null !== data)
        UserIDs.XSRF = data;
});
proxy.emitter.on("CSRF_Loaded", data => {
    if (null !== data)
        UserIDs.CSRF = data;
});
proxy.emitter.on("CID_Loaded", data => {
    if (null !== data)
        UserIDs.CID = data;
});
proxy.emitter.on("WID_Loaded", data => {
    if (null !== data)
        UserIDs.WID = data;
});
proxy.emitter.on("UID_Loaded", data => {
    if (null !== data) {
        UserIDs.UID = data;
        downloadForgeHX().then(() => {
            if (null !== UserIDs.UID && !Lwin.isDestroyed()) {
                createMenuLoggedIn();
                AddButton("Funktionen", "function");
                AddButton("Alle Moppeln", "function", () => { console.log("alle Moppeln") });
                AddButton("Alle Besuchen", "function", () => { console.log("alle Besuchen") });
                Lwin.destroy();
                builder.init(UserIDs.UID, VS, UserIDs.WID);
                builder.GetStartup()
                    .then(body => {
                        processer.GetTavernInfo(body);
                        processer.GetFriends(body);
                        Gwin.webContents.send("fillDiv",processer.SocialDict);
                        Gwin.webContents.send("fillDiv",processer.TavernDict);
                    });
            }
        });
    }
});

function createBrowserWindow(url) {
    const win = new BrowserWindow({
        height: 600,
        width: 800
    });
    win.loadURL(url);
    Lwin = win;
}