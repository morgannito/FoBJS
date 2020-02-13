class Timer {

    _running = false;
    _iv = null;
    _timeout = null;
    _cb = null;

    get timeout(){
        return this._timeout;
    }

    set iv(val){
        this._iv = val;
    }
    get iv(){
        return this._timeout;
    }

    set cb(val){
        this._cb = val;
    }
    get cb(){
        return this._cb;
    }
    
    set running(val){
        this._running = val;
    }
    get running(){
        return this._running;
    }

    constructor(iv, cb) {
        this._iv = iv;
        this._cb = cb;
    }

    start = function (cb = false,iv = false) {
        var elm = this;
        clearInterval(this._timeout);
        this._running = true;
        if(cb) this._cb = cb;
        if(iv) this._iv = iv;
        this._timeout = setTimeout(function () { elm.execute(elm); }, this.iv);
    };
    execute = function (e) {
        if (!e._running){
            return false;
        }
        else{
            e.cb();
            e.start();
        }
    };
    stop = function () {
        this._running = false;
    };
    set_interval = function (iv) {
        clearInterval(this._timeout);
        this.start(false, iv);
    };
}

exports.Timer = Timer;