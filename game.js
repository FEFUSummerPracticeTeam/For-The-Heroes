// Контроллер, связывающий движок в игру
var ctx = new CustJS('my_canvas');

ctx.set_scene('my_scene',function (){
    var r = ctx.create_object(this,{
        position: ctx.vector2(50,50),
        size: ctx.vector2(100,100),
        width: 100,
        height: 100,
        sprite:""
    });

    this.init = function (){
        console.log('inited');
    };
    this.update = function (){
        r.move(ctx.vector2(1,0));
    };
    this.draw = function (){
    };
    this.exit = function (){
    };

})