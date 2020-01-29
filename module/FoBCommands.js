function getAllCommands(){
    return [
        'MoppleAll',
        'VisitAll',
        'UpdateList',
        'SearchSnipLG',
        'StartProductonBot',
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