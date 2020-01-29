const { app, BrowserWindow, session, screen, ipcMain } = require("electron");
const FoBuilder = require("./FoBuilder");
const processer = require("./FoBProccess");
const FoBCore = require("./FoBCore");
const Main = require("../main");

var PD = [];

var ProductionWorker;

const  StartProductionBot = () =>{
    PD = processer.ProductionDict;

    ProductionWorker = new BrowserWindow({
        show:false,
        webPreferences: {nodeIntegration:true}
    });

    ProductionWorker.loadFile('/html/prodworker.htm');

    ipcMain.on('worker_loaded', () => {
        ProductionWorker.webContents.send('prodDict', PD);
    });
    //Main.GetData();
}

exports.StartProductionBot = StartProductionBot;