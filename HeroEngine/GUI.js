// Часть движка, осуществляющая отрисовку игры в канвасе
var CustJS = function (_box, _layers) { // _box - поле в котором будут созадаваться canvases, _layers - слои которые передаются при создании движка(теперь их можно парсить)
    'use strict'
    var CustJS = this;


    // CONFIG//
    var config = {font_size: 50, font_name: "serif"}

    //GLOBALS//
    var size = null
        , canvas_offset = null
        , running = false
        , active_scene = null
        , layer = null
        , object_id = 0;


    //INIT//
    var _INIT = () => {
        if (typeof _box !== 'object') _box = document.getElementById(_box); // создаем коробку в которую будем помещать много canvas и таким создавать слои

        var box = _box.getBoundingClientRect();
        canvas_offset = vector2(box.left, box.top); // смещение объекта
        size = vector2(box.width, box.height);
        this.size = size;

        if (typeof _layers === 'object') {
            var i, j = 0;
            for (i in _layers) {
                CustJS.create_layer(i, ++j, !!_layers[i].auto_clear);
            }
        } else {
            CustJS.create_layer('main', 0, true);
            CustJS.select_layer("main")
        }
    };


    //MATH//
    var is_int = function (num) {// здесь будет проверка на число
        return num
    }


    //LAYERS//
    var layers = {};               // здесь будут лежать все слои
    var clear_layers = [];          // здесь будут лежать слои с авто очисткой
    class Layer {                    // класс слоя в котором создается canvas в установленной коробке
        constructor(index) {        // индекс для глубины слоя
            var cnv = document.createElement("canvas");
            cnv.style.cssText = 'position: absolute; left: ' + canvas_offset.x + 'px;top: ' + canvas_offset.y + 'px;';
            cnv.width = size.x;
            cnv.height = size.y;
            cnv.style.zIndex = 100 + index;
            document.body.appendChild(cnv);

            this.canvas = cnv;
            this.context = cnv.getContext('2d');
        }

        clear() {     // метод очистки слоя (выполняется в _update)
            this.context.clearRect(0, 0, size.x, size.y);
        }

        draw_object(p) { // метод рисования на слое
            this.context.globalAlpha=p.opacity;
            var dp = vp(p.x, p.y);
            if (p.color) {
                this.context.fillStyle = p.color;
                this.context.fillRect(dp.x, dp.y, p.width, p.height);
            }
            if (p.file) {
                if (!imgList[p.file]) return;
                if (!imgList[p.file].loaded) return;
                this.context.drawImage(imgList[p.file].image, dp.x, dp.y, p.width, p.height);
            }
            this.context.globalAlpha=1;
        }

        draw_text(p) {
            this.context.globalAlpha=p.opacity;
            if (p.font || p.size)
                this.context.font = (p.size || config.font_size) + "px " + (p.font || config.font_name);
            if (p.color) {
                this.context.fillStyle = p.color;
                this.context.fillText(p.text, p.x, p.y,)
            }
            this.context.globalAlpha=1;
        }
    }

    CustJS.create_layer = function (id, index, is_auto_clear) {   // метод для создания слоя с id  для массива, индексом для глубины слоя и булевая переменная на авто очистку
        if (layers[id]) return
        layers[id] = new Layer(index);
        if (is_auto_clear) clear_layers.push(layers[id]);
    };
    CustJS.select_layer = function (id) {  // метод выбора слоя для рисования
        if (!layers[id]) return
        layer = layers[id];
        return layer;
    };
    CustJS.get_layer = function (id) {
        if (!layers[id]) return
        return layers[id];
    }


    //VECTORS//
    class Vector2 {  // класс сделанный для перемещения объектов с помощью векторной системы (из вне только через функцию ниже)

        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        plus(v) {
            this.x += v.x;
            this.y += v.y;
            return this;
        }

        minus(v) {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        }

    }

    var vector2 = this.vector2 = function (x, y) {  // для работы с вектором
        return new Vector2(x, y);
    }


    //ENGINE//
    var _update = function () {  // функция для обновления интерфейса (не для использования из вне)
        active_scene.update();
        for (let i in clear_layers)
            clear_layers[i].clear();
        active_scene.draw_objects();
        active_scene.draw();

        if (running) requestAnimationFrame(_update);
    }


    this.start = function (name) {  // функция  для старта сцены (для работы программиста из вне)
        if (running) return
        running = CustJS.set_scene(name);
        if (running)
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
            this.scene.nodes.forEach((node) => {
                node.update !== undefined ? node.update(node) : null;
            });
        }

        exit() {
            this.scene.exit();
        }

        draw_objects() {                    // отрисовывает все объекты
            this.scene.nodes.forEach((node) => {
                node.draw !== undefined ? node.draw() : null;
            });
        }
    }

    this.create_scene = function (name, Construct) { // функция для создания сцены из вне
        if (scenes[name]) return;
        scenes[name] = new Scene(new Construct);
        return scenes[name];
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
        constructor(p, update) {
            this.update = update;
            this.position = p.position;
            this.size = p.size;
            this.color = p.color;
            this.sprite = false;
            this.layer = p.layer || "main";
            this.obj = p.obj;
            this.id = object_id++;
            this.isDying = false;
            this.opacity = p.opacity||1;
            this.death_speed = p.death_speed||1;

            if (p.sprite) {
                this.sprite = p.sprite;
                LoadImage(p.sprite);
            }
        }

        draw() {
            if (this.IsInView()) {
                if (!this.isDying)
                    layers[this.layer].draw_object({
                        x: this.position.x,
                        y: this.position.y,
                        width: this.size.x,
                        height: this.size.y,
                        color: this.color,
                        file: this.sprite
                    })
                else {
                    if (this.opacity > 0.1) {
                        this.opacity -= this.death_speed;
                        layers[this.layer].draw_object({
                            x: this.position.x,
                            y: this.position.y,
                            width: this.size.x,
                            height: this.size.y,
                            color: this.color,
                            file: this.sprite,
                            opacity:this.opacity
                        })
                    } else {
                        this.position = vector2(-1000, -1000);
                    }
                }
            }
        }

        move(p) {
            this.position.plus(p);// тк это вектор
        }

        isCollision(obj) {
            return !(this.position.x + this.size.x < obj.position.x ||
                this.position.y + this.size.y < obj.position.y ||
                this.position.x > obj.position.x + obj.size.x ||
                this.position.y > obj.position.y + obj.size.y);
        }

        IsInView() {
            return (this.position.x + this.size.x > view.position.x - size.x) &&
                (this.position.y + this.size.y > view.position.y - size.y) &&
                (this.position.x < view.position.x + size.x) &&
                (this.position.y < view.position.y + size.y)
        }

        destroy() {
            this.isDying = true;
            //objects.splice(this.id,1)


        }
    }

    class text_object extends object {
        constructor(p, construct) {
            super(p, construct);
            this.font = p.font;
            this.text = p.text;
        }

        draw() {
            layers[this.layer].draw_text({
                x: this.position.x,
                y: this.position.y,
                size: this.size,
                color: this.color,
                text: this.text,
                opacity:this.opacity
            })

        }


    }

    this.create_object = function (scene, params, update) { // функция для создания объектов на сцене для использования из вне
        if (typeof scene.nodes === "undefined")
            var nds = scene.nodes = [];
        var nds = scene.nodes;
        let obj = params.text !== undefined ? new text_object(params, update) : new object(params, update);
        nds.push(obj)
        return obj;
    }

    //VIEWPORT//
    var view = CustJS.view = new function () {  // работа с камерой
        this.position = vector2(0, 0);

        this.move = function (v) { // двигаем камеру
            this.position.x = ((v.x - size.x / 2 > 0) && (v.x + size.x / 2 < (mapWidth + 1) * 32 * MapScale)) ? v.x - size.x / 2 : this.position.x;
            this.position.y = ((v.y - size.y / 2 > 0) && (v.y + size.y / 2 < (mapHeight + 1) * 32 * MapScale)) ? v.y - size.y / 2 : this.position.y;
        }
    };
    var vp = function (x, y) {          // расчет смещения объектов  относительно камеры
        return vector2(x, y).minus(view.position);
    };


    //IMAGE_LOAD//
    var imgList = {};                    // создаем хранилище спрайтов
    var LoadImage = function (file) {
        if (imgList[file]) return;  // проверяем загрузили ли мы уже этот спрайт

        var image = document.createElement('img');

        imgList[file] = {
            loaded: false,
            image: image
        };

        var _image = imgList[file];

        image.onload = function () {   // если спрайт получен даем добро на использование картинки
            _image.loaded = true;
        };
        image.src = file;
    };


    _INIT();
    window.CustJSGlobal = CustJS;

};