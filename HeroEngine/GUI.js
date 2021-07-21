// Часть движка, осуществляющая отрисовку игры в канвасе
var CustJS = function (_canvas) {
    'use strict'
    var CustJS = this;

    //GLOBALS//
    var canvas = null
        , size = null
        , context = null;

    //INIT//
    var _INIT = function () {
        if (typeof _canvas !== 'object') canvas = document.getElementById(_canvas);
        else canvas = _canvas;
        context = canvas.getContext('2d');
        size = vector2(canvas.width, canvas.height);

        var pos = canvas.getBoundingClientRect();
        canvas.offset = vector2(pos.left, pos.right);
        context.fillText("Hi me",50,50);
    }


//VECTORS//
    var Vector2 = function (x, y) {
        this.x = x;
        this.y = y;
    };


    var vector2 = this.vector2 = function (x, y) {
        return new Vector2(x, y);
    }


    _INIT();
    window.CustJSGlobal = CustJS;

};