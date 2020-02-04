const { app, BrowserWindow, session, screen, ipcMain } = require("electron");

const processer = require("./FoBProccess");
const FoBuilder = require("./FoBuilder");
const FoBCore = require("./FoBCore");
const Main = require("../main");
const events = require('events');

const myEmitter = new events.EventEmitter();

var IntervallID = null;

var PWW = null;

var ProdDict = [];

function StartProductionBot() {

    var ProductionWorker = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            allowRunningInsecureContent: true
        }
    });
    PWW = ProductionWorker;
    PWW.loadFile('html/prodworker.html');

    ipcMain.on('worker_loaded', () => {
        PWW.webContents.send('start', processer.ProductionDict);
    });

    ipcMain.on('DoWork', (e, d) => {
        ProdDict = d.ProdDict;
        DoWork(d.isAuto);
    });
}

function DoWork(isAuto) {
    var promArr = [];
    var started = false;
    for (var i = 0; i < ProdDict.length; i++) {
        const prodUnit = ProdDict[i];
        if (prodUnit["state"]["__class__"] === "IdleState") {
            promArr.push(FoBuilder.DoQueryProduction(prodUnit["id"], Main.CurrentProduction.id));
            started = true;
        }
        else if (prodUnit["state"]["__class__"] === "ProductionFinishedState") {
            promArr.push(FoBuilder.DoCollectProduction([prodUnit["id"]]));
        }
    }

    Promise.all(promArr).then(values => {
        if(!isAuto) isAuto = true;
        if (started) {
            myEmitter.emit("TimeUpdate", ((new Date().getTime() + 1000 * 60 * Main.CurrentProduction.time) / 1000));
            IntervallID = setInterval(() => {
                myEmitter.emit("UpdateMenu", "");
            }, 500);
        } else {
            myEmitter.emit("TimeUpdate", null);
            clearInterval(IntervallID);
            isAuto = false;
        }
        Main.GetData(true, () => {
            ProdDict = processer.ProductionDict;
            PWW.webContents.send('updateProdDict',{ProdDict, isAuto});
        });
    }, reason => {
        throw reason;
    });
}

function CollectManuel(ConsoleWin) {
    var promArr = [];
    ConsoleWin.webContents.send('print', `Do: Self-Collect productions`);
    for (let i = 0; i < processer.ProductionDict.length; i++) {
        const prodUnit = processer.ProductionDict[i];
        if (prodUnit["state"]["__class__"] === "ProductionFinishedState") {
            promArr.push(FoBuilder.DoCollectProduction([prodUnit["id"]]));
        }
    }
    Promise.all(promArr).then(values => {
        myEmitter.emit("TimeUpdate", null);
        Main.GetData(true, () => {
            ConsoleWin.webContents.send('print', `Done all`);
        });
    }, reason => {
        throw reason;
    });
}

function StartManuel(ConsoleWin) {
    var promArr = [];
    ConsoleWin.webContents.send('print', `Do: Self-Start productions`);
    for (let i = 0; i < processer.ProductionDict.length; i++) {
        const prodUnit = processer.ProductionDict[i];
        if (prodUnit["state"]["__class__"] === "IdleState") {
            promArr.push(FoBuilder.DoQueryProduction(prodUnit["id"], Main.CurrentProduction.id));
        }
    }
    Promise.all(promArr).then(values => {
        myEmitter.emit("TimeUpdate", ((new Date().getTime() + 1000 * 60 * Main.CurrentProduction.time) / 1000));
        Main.GetData(true, () => {
            ConsoleWin.webContents.send('print', `Done all`);
            IntervallID = setInterval(() => {
                myEmitter.emit("UpdateMenu", "");
            }, 500);
        });
    }, reason => {
        throw reason;
    });
}


function StopProductionBot() {
    if (null !== PWW) {
        PWW.webContents.send('stop');
        PWW.destroy();
    }
    PWW = null;
    Main.GetData();
}

exports.StartProductionBot = StartProductionBot;
exports.StopProductionBot = StopProductionBot;
exports.CollectManuel = CollectManuel;
exports.StartManuel = StartManuel;
exports.emitter = myEmitter;