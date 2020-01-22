exports.pWL = printWelcomeMessage;
exports.getRandomInt = getRandomInt;
exports.delay = delay;
exports.printInfo = printInfo;

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

async function delay(ms){
    new Promise(res => setTimeout(res,ms));
}

function printWelcomeMessage(Gwin,app, callback){
    Gwin.webContents.send('print', "#########################################");
    Gwin.webContents.send('print', "#########################################");
    Gwin.webContents.send('print', "######### WELCOME TO FoB v"+app.getVersion()+" #########");
    Gwin.webContents.send('print', "#########################################");
    Gwin.webContents.send('print', "#########################################");
    Gwin.webContents.send('print', " ");
    Gwin.webContents.send('print', " ");
    Gwin.webContents.send('print', "We are going to setup some things....");
    Gwin.webContents.send('print', " ");
    setTimeout(()=>{
        Gwin.webContents.send('print', "Done :D");
        Gwin.webContents.send('print', "You can now do Stuff!");
        callback();
    },2000)
}

function printInfo(Gwin, htmltext){
    Gwin.webContents.send('information', htmltext);
}