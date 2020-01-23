function getAllCommands(){
    return [
        'MoppleAll',
        'VisitAll',
        'UpdateList',
        'SearchSnipLG',
        'Logout'
    ]
}

function getLoginCommands(){
    return [
        'Login'
    ]
}

exports.getAllCommands = getAllCommands;
exports.getLoginCommands = getLoginCommands;