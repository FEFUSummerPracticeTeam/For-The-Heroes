// Контроллер, связывающий движок в игру
// пока я тут пишу тесты
var ctx = new CustJS('my_game', {
    'back': {
        "auto_clear": false
    },
    'main': {
        "auto_clear": true
    }

});

ctx.create_scene('my_scene', function () {
    var r = ctx.create_object(this, {
            position: ctx.vector2(50, 50),
            size: ctx.vector2(100, 100),
            width: 100,
            height: 100,
            sprite: "",
            layer: "main"
        },
        function () {
            this.update = function () {
                r.move(ctx.vector2(1, 0));
            }
        }
    );
    var t = ctx.create_object(this, {
            position: ctx.vector2(50, 50),
            size: ctx.vector2(100, 100),
            width: 100,
            height: 100,
            sprite: "",
            layer: "back"
        },
        function () {
            this.update = function () {
                //r.move(ctx.vector2(1, 0));
            }
        }
    );

    this.init = function () {
        console.log('inited');
        // ctx.get_layer('back').draw_object({x:10,y:10,width: 500,height: 300})
    };
    this.update = function () {
        //r.move(ctx.vector2(1,0));
        // ctx.view.move(ctx.vector2(1,0));
        console.log(r.isCollision(t))
    };
    this.draw = function () {
    };
    this.exit = function () {
    };

})
ctx.start('my_scene')