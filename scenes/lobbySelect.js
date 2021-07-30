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

    ctx.create_scene('lobby_select', function () {

        this.init = function () {

        };
        this.update = function () {

        };
        this.draw = function () {
        };
        this.exit = function () {
        };

    });
    ctx.start('lobby_select');
}