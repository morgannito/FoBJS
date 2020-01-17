const { app, BrowserWindow, session, screen, Menu, dialog, protocol, ipcMain } = require("electron");
const req = require("request");
global.fetch = require("node-fetch");
const https = require("https");
const url = require("url");

const proxy = require("./module/FoEProxy");

const dialogOptions = { type: 'info', buttons: ['OK', 'Cancel'] }

var Gwin = null;

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
                win.webContents.openDevTools();
            }
        },
        {
            label: 'Quit',
            click: () => {
                app.quit();
            }
        }
    ];

    const menu = Menu.buildFromTemplate(menuTempate);
    Menu.setApplicationMenu(menu);

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
        Gwin.webContents.send("invalidSession", "https://de.forgeofempires.com/")
    }
}

proxy.emitter.on("SID_Loaded", data => {
    if (null !== data)
        Gwin.webContents.send("alert", "SID: "+data);
});

proxy.emitter.on("XSRF_Loaded", (data) => {
    if (null !== data)
        Gwin.webContents.send("alert", "XSRF: "+data);
});
proxy.emitter.on("CSRF_Loaded", data => {
    if (null !== data)
        Gwin.webContents.send("alert", "CSRF: "+data);
});
proxy.emitter.on("CID_Loaded", data => {
    if (null !== data)
        Gwin.webContents.send("alert", "CID: "+data);
});