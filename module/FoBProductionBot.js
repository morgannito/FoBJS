const { app, BrowserWindow, session, screen, ipcMain } = require("electron");

const processer = require("./FoBProccess");
const FoBuilder = require("./FoBuilder");
const FoBCore = require("./FoBCore");
const Main = require("../main");
const events = require('events');
const path = require('path');

const asarPath = path.join(app.getAppPath());

const myEmitter = new events.EventEmitter();

var IntervallID = null;

var PWW = null;

var ProdDict = [];
var ResDict = [];
var GoodProdDict = [];

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
    PWW.loadFile(path.join(asarPath,"html","prodworker.html"));

    ipcMain.on('worker_loaded', () => {
        ProdDict = processer.ProductionDict;
        ResDict = processer.ResidentialDict;
        GoodProdDict = processer.GoodProdDict;
        PWW.webContents.send('start', {ProdDict,ResDict, GoodProdDict});
        Main.BotsRunning.ProductionBot = true;
    });

    ipcMain.on('DoWork', (e, d) => {
        ProdDict = d.ProdDict;
        ResDict = d.ResDict;
        GoodProdDict = d.GoodProdDict;
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
    for (var i = 0; i < ResDict.length; i++) {
        const resUnit = ResDict[i];
        if (resUnit["state"]["__class__"] === "ProductionFinishedState") {
            promArr.push(FoBuilder.DoCollectProduction([resUnit["id"]]));
        }
    }
    for (var i = 0; i < GoodProdDict.length; i++) {
        const goodUnit = GoodProdDict[i];
        if (goodUnit["state"]["__class__"] === "IdleState") {
            promArr.push(FoBuilder.DoQueryProduction(goodUnit["id"], Main.CurrentGoodProduction.id));
            started = true;
        }
        else if (goodUnit["state"]["__class__"] === "ProductionFinishedState") {
            promArr.push(FoBuilder.DoCollectProduction([goodUnit["id"]]));
        }
    }
    Promise.all(promArr).then(values => {
        if(!isAuto) isAuto = true;
        if (started) {
            IntervallID = setInterval(() => {
                myEmitter.emit("UpdateMenu", "");
            }, 500);
        } else {
            clearInterval(IntervallID);
            isAuto = false;
        }
        Main.GetData(true, () => {
            ProdDict = processer.ProductionDict;
            ResDict = processer.ResidentialDict;
            GoodProdDict = processer.GoodProdDict;
            PWW.webContents.send('updateProdDict',{ProdDict, ResDict,GoodProdDict,isAuto});
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
    for (let i = 0; i < processer.ResidentialDict.length; i++) {
        const resUnit = processer.ResidentialDict[i];
        if (resUnit["state"]["__class__"] === "ProductionFinishedState") {
            promArr.push(FoBuilder.DoCollectProduction([resUnit["id"]]));
        }
    }
    for (let i = 0; i < processer.GoodProdDict.length; i++) {
        const goodUnit = processer.GoodProdDict[i];
        if (goodUnit["state"]["__class__"] === "ProductionFinishedState") {
            promArr.push(FoBuilder.DoCollectProduction([goodUnit["id"]]));
        }
    }
    Promise.all(promArr).then(values => {
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
    for (let i = 0; i < processer.GoodProdDict.length; i++) {
        const goodUnit = processer.GoodProdDict[i];
        if (goodUnit["state"]["__class__"] === "IdleState") {
            promArr.push(FoBuilder.DoQueryProduction(goodUnit["id"], Main.CurrentGoodProduction.id));
        }
    }
    Promise.all(promArr).then(values => {
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
    Main.BotsRunning.ProductionBot = false;
    Main.GetData();
}

exports.StartProductionBot = StartProductionBot;
exports.StopProductionBot = StopProductionBot;
exports.CollectManuel = CollectManuel;
exports.StartManuel = StartManuel;
exports.emitter = myEmitter;