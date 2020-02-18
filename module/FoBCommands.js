const FoBMain = require("../main");

function getAllCommands(){
    return [
        FoBMain.i18n("Menu.Login")
    ]
}

function getLoginCommands(){
    return [
        FoBMain.i18n("Menu.Login")
    ]
}

exports.getAllCommands = getAllCommands;
exports.getLoginCommands = getLoginCommands;