// Контроллер, связывающий движок в игру
// пока я тут пишу тесты
import * as gameRoom from './scenes/gameRoom.js';
import * as lobbyRoom from './scenes/lobbyRoom.js';
import * as nameEnterRoom from './scenes/nameEnterRoom.js';

let scenes = [gameRoom, lobbyRoom, nameEnterRoom]
let ctx = new CustJS('my_game', {
    'cells': {
        "auto_clear": true
    },
    'decorations': {
        "auto_clear": true
    },
    'main': {
        "auto_clear": true
    },
    'text': {
        "auto_clear": true
    },
    'window': {
        "auto_clear": true
    },
    'window_text': {
        "auto_clear": true
    }
});
for (const scene of scenes) {
    scene.launch(ctx);
}
ctx.start('nameEnterRoom')