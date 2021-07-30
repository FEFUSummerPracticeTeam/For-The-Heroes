export function launch() {
    var ctx = new CustJS('my_game', {
        'cells': {
            "auto_clear": true
        },
        'decorations': {
            "auto_clear": true
        },
        'main': {
            "auto_clear": true
        }

    });

    ctx.create_scene('name_select', function () {
        let name = String('');
        this.init = function () {
            ctx.create_object(this, {
                size: 50,
                position: ctx.vector2(ctx.size.x / 2, ctx.size.y / 2),
                text: 'Введите имя',
                anchor: 1,
                color: 'black'
            });
            ctx.create_object(this, {
                position: ctx.vector2(150, 150),
                size: 30,
                text: name,
                anchor: 1,
                color: 'black'
            });
            window.addEventListener('keydown', (event) => {
                let key = event.code;
                name += String.fromCharCode((96 <= key && key <= 105) ? key - 48 : key);
            });
        };
        this.update = function () {

        };
        this.draw = function () {
        };
        this.exit = function () {
        };

    });
    ctx.start('name_select');
}