const { app, BrowserWindow, session, screen, ipcMain } = require("electron");

const processer = require("./FoBProccess");
const FoBuilder = require("./FoBuilder");
const FoBCore = require("./FoBCore");
const Main = require("../main");

PWW = null;

function StartProductionBot(){

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

    ipcMain.on('ChangeState', (e, d) => {
        Main.GetData(true, () => {
            PWW.webContents.send('updateProdDict', processer.ProductionDict);
        });
    });

    ipcMain.on('DoQuery', (e, d) => {
        FoBuilder.DoQueryProduction(d.Unit, d.Product)
            .then(data => {
                //console.log(data);
                Main.GetData(true, () => {
                    PWW.webContents.send('updateProdDict', processer.ProductionDict);
                });
            })
    })

    ipcMain.on('DoCollect', (e, d) => {
        FoBuilder.DoCollectProduction([d.Unit])
            .then(data => {
                //console.log(data);
                Main.GetData(true, () => {
                    PWW.webContents.send('updateProdDict', processer.ProductionDict);
                });
            })
    })
}

function CollectManuel(){
    for (let i = 0; i < processer.ProductionDict.length; i++) {
        const prodUnit = processer.ProductionDict[i];
        if (prodUnit["state"]["__class__"] === "ProductionFinishedState") {
            FoBuilder.DoCollectProduction([prodUnit["_id"]])
                .then(() => {
                    Main.GetData(true);
                });
        }
    }
}

function StartManuel(){
    for (let i = 0; i < processer.ProductionDict.length; i++) {
        const prodUnit = processer.ProductionDict[i];
        if (prodUnit["state"]["__class__"] === "IdleState") {
            FoBuilder.DoQueryProduction(prodUnit["_id"],1)
                .then(() => {
                    Main.GetData(true);
                });
        }
    }
}


function StopProductionBot(){
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