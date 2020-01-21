exports.pWL = printWelcomeMessage;
exports.getRandomInt = getRandomInt;

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function printWelcomeMessage(Gwin){
    Gwin.webContents.send('print', "#########################################");
    Gwin.webContents.send('print', "#########################################");
    Gwin.webContents.send('print', "######### WELCOME TO FoB v0.1.0 #########");
    Gwin.webContents.send('print', "#########################################");
    Gwin.webContents.send('print', "#########################################");
    Gwin.webContents.send('print', " ");
    Gwin.webContents.send('print', " ");
    Gwin.webContents.send('print', "We are going to setup some things....");
    Gwin.webContents.send('print', " ");
    setTimeout(()=>{
        Gwin.webContents.send('print', "Done :D");
        Gwin.webContents.send('print', "You can now do Stuff!");
    },2000)
}