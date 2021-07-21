// Часть движка, осуществляющая отрисовку игры в канвасе
var CustJS = function (_canvas) {
    'use strict'
    var CustJS = this;

    //GLOBALS//
    var canvas = null
        , size = null
        , running = false
        , active_scene = null
        , context = null;

    //INIT//
    var _INIT = function () {
        if (typeof _canvas !== 'object') canvas = document.getElementById(_canvas);
        else canvas = _canvas;
        context = canvas.getContext('2d');
        size = vector2(canvas.width, canvas.height);

        var pos = canvas.getBoundingClientRect();
        canvas.offset = vector2(pos.left, pos.right);
        // context.fillText("Hi me",50,50);
    };


    //MATH//
    var is_int= function (num){// здесь будет проверка на число
        return num
    }

    //VECTORS//
    class Vector2 {  // класс сделанный для перемещения объектов с помощью векторной системы (из вне только через функцию ниже)

    constructor (x, y) {
        this.x = x;
        this.y = y;
    }

    plus(p){
        this.x+=p.x;
        this.y+=p.y;
    }

    }


    var vector2 = this.vector2 = function (x, y) {  // для работы с вектором
        return new Vector2(x, y);
    }


    //ENGINE//
    var _update = function (){  // функция для обновления интерфейса (не для использования из вне)
        active_scene.update();
        active_scene.draw_objects();
        active_scene.draw();

        if(running)
            requestAnimationFrame(_update);
    }


    this.start = function (name) {  // функция  для старта сцены (для работы программиста из вне)
        if (running) return
        running = CustJS.set_scene(name);
        if(running)
            _update();
    };





    //SCENES//
    var scenes = {};// массив со сценами

    class Scene {                   // класс сцены который создается через специальную функцию(не из вне)
        constructor(scn) {
            this.scene = scn;
        }

        init() {                        // функции которые задаются при создании сцены из вне
            this.scene.init();
        }

        draw() {
            this.scene.draw();
        }

        update() {
            this.scene.update();
        }

        exit() {
            this.scene.exit();
        }

        draw_objects() {                    // отрисовывает все объекты
            for (let i = 0; i < this.scene.nodes.length; i++)
                if (typeof this.scene.nodes[i].draw !== "undefined")
                    this.scene.nodes[i].draw();

        }
    }

    this.create_scene = function (name, Construct) { // функция для создания сцены из вне
        scenes[name] = new Scene(new Construct);
    }
    this.set_scene = function (name) {              // функция для смены сцены (передается имя сцены, по которому извлекается из массива)
        if (!name || !scenes[name]) return false;  // проверка на наличие таковой

        if (active_scene)                          // закрывает сцену играющую сейчас сцену и запускает новую
            active_scene.exit();

        active_scene = scenes[name];
        active_scene.init();
        return true;
    }

    //OBJECTS//
    class object {
        constructor(p) {
            this.position = p.position;
            this.width = p.width;
            this.height = p.height;
            this.sprite = new Image();
            this.sprite.src = p.sprite;
        }

        draw() {
            context.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        }
        move(p){
            this.position.plus(p);// тк это вектор
        }
    }

    var create_object = function (p) {
        return new object(p);
    }
    this.create_object = function (scene, params) { // функция для создания объектов на сцене для использования из вне
        if (typeof scene.nodes === "undefined")
            var nds = scene.nodes = [];
        let obj = create_object(params)
        nds.push(obj)
        return obj;
    }


    _INIT();
    window.CustJSGlobal = CustJS;

};