// Часть движка, осуществляющая отрисовку игры в канвасе
var CustJS = function (_box,_layers) { // _box - поле в котором будут созадаваться canvases, _layers - слои которые передаются при создании движка(теперь их можно парсить)
    'use strict'
    var CustJS = this;





    //GLOBALS//
    var  size = null
        ,canvas_offset = null
        , running = false
        , active_scene = null
        ,layer = null;





    //INIT//
    var _INIT = function () {
        if (typeof _box !== 'object') _box = document.getElementById(_box); // создаем коробку в которую будем помещать много canvas и таким создавать слои

        var box = _box.getBoundingClientRect();
        canvas_offset = vector2(box.left, box.top); // смещение объекта
        size = vector2(box.width, box.height);

        if(typeof _layers ==='object'){
            var i,j=0;
            for(i in _layers){
                CustJS.create_layer(i,++j,!!_layers[i].auto_clear);
            }
        }
        else {
            CustJS.create_layer('main', 0, true);
            CustJS.select_layer("main")
        }
    };


    //MATH//
    var is_int= function (num){// здесь будет проверка на число
        return num
    }








    //LAYERS//
    var layers = {};               // здесь будут лежать все слои
    var clear_layers = [];          // здесь будут лежать слои с авто очисткой
    class Layer{                    // класс слоя в котором создается canvas в установленной коробке
        constructor(index) {        // индекс для глубины слоя
            var cnv = document.createElement("canvas");
            cnv.style.cssText = 'position: absolute; left: '+canvas_offset.x+'px;top: '+canvas_offset.y+'px;';
            cnv.width = size.x;
            cnv.height = size.y;
            cnv.style.zIndex = 100+index;
            document.body.appendChild(cnv);

            this.canvas = cnv;
            this.context = cnv.getContext('2d');
        }

        clear(){     // метод очистки слоя (выполняется в _update)
            this.context.clearRect(0,0,size.x,size.y);
        }

        draw_object(p){ // метод рисования на слое
            this.context.fillStyle = "red";
            var dp = vp(p.x,p.y);
            this.context.fillRect(dp.x,dp.y,p.width,p.height);
            /*context.drawImage(this.sprite, this.x, this.y, this.width, this.height);*/
           /* this.cont.fillText("Hi me",50,50);*/
        }
    }

    CustJS.create_layer = function (id, index,is_auto_clear ) {   // метод для создания слоя с id  для массива, индексом для глубины слоя и булевая переменная на авто очистку
        if(layers[id])return
        layers[id] = new Layer(index);
        if(is_auto_clear) clear_layers.push(layers[id]);
    };
    CustJS.select_layer = function (id) {  // метод выбора слоя для рисования
        if(!layers[id])return
        layer = layers[id];
        return layer;
    };
    CustJS.get_layer = function (id) {
        if(!layers[id])return
        return layers[id];
    }









    //VECTORS//
    class Vector2 {  // класс сделанный для перемещения объектов с помощью векторной системы (из вне только через функцию ниже)

    constructor (x, y) {
        this.x = x;
        this.y = y;
    }

    plus(v){
        this.x+=v.x;
        this.y+=v.y;
        return this;
    }
    minus(v){
        this.x-=v.x;
        this.y-=v.y;
        return this;
    }

    }

    var vector2 = this.vector2 = function (x, y) {  // для работы с вектором
        return new Vector2(x, y);
    }





    //ENGINE//
    var _update = function (){  // функция для обновления интерфейса (не для использования из вне)
        active_scene.update();
        for(let i in clear_layers)
            clear_layers[i].clear();
        active_scene.draw_objects();
        active_scene.draw();

        if(running) requestAnimationFrame(_update);
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
            for(let i in this.scene.nodes) this.scene.nodes[i].update();
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
        if(scenes[name]) return;
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
        constructor(p,construct) {
            this.obj = construct;
            this.position = p.position;
            this.size = p.size;
            this.sprite = new Image();
            this.sprite.src = p.sprite;
            this.layer = p.layer || "main" ;
        }

        draw() {
            layers[this.layer].draw_object({
                x:this.position.x,
                y:this.position.y,
                width: this.size.x,
                height: this.size.y,
                sprite: this.sprite
            })
        }
        move(p){
            this.position.plus(p);// тк это вектор
        }
        update(){   // функция которая берет функцию написанную как параметр при создании данного объекта
            this.obj.update();
        }
        isCollision(obj){
            return !(this.position.x+this.size.x < obj.position.x ||
                     this.position.y+this.size.y < obj.position.y ||
                     this.position.x > obj.position.x+obj.size.x ||
                     this.position.y > obj.position.y + obj.size.y);
        }
    }

    var create_object = function (p,Constructor) {
        return new object( p,new Constructor());
    }
    this.create_object = function (scene, params,update) { // функция для создания объектов на сцене для использования из вне
        if (typeof scene.nodes === "undefined")
            var nds = scene.nodes = [];
        var nds = scene.nodes;
        let obj = create_object(params,update)
        nds.push(obj)
        return obj;
    }




        //VIEWPORT//
    var view = CustJS.view = new function () {  // работа с камерой
        this.position= vector2(0,0);

        this.move= function (v) { // двигаем камеру
            this.position.plus(v)
        }
    };
    var vp = function (x,y) {          // расчет смещения объектов  относительно камеры
        return vector2(x,y).minus(view.position);
    };
    
    
    
    
    
    
    
    
    
    
    _INIT();
    window.CustJSGlobal = CustJS;

};