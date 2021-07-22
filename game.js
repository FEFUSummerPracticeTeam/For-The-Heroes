// Контроллер, связывающий движок в игру
// пока я тут пишу тесты
var ctx = new CustJS('my_game');
ctx.create_layer('background',-1,false);

ctx.create_scene('my_scene',function (){
    var r = ctx.create_object(this,{
        position: ctx.vector2(50,50),
        size: ctx.vector2(100,100),
        width: 100,
        height: 100,
        sprite:""
    });

    this.init = function (){
        console.log('inited');
        ctx.select_layer('background').draw_object({x:10,y:10,width: 500,height: 300})
        ctx.select_layer("main")
    };
    this.update = function (){
        r.move(ctx.vector2(1,0));
    };
    this.draw = function (){
    };
    this.exit = function (){
    };

})
ctx.start('my_scene')