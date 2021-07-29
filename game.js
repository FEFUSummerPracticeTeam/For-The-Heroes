// Контроллер, связывающий движок в игру
// пока я тут пишу тесты
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

ctx.create_scene('my_scene', function () {

    var turn_tracker;
    this.init = function () {
        var objects_on_field = [];
        var players_on_field = [];
        gameInitialize();
        let current_player = getCurrentPlayerIndex();
        var game_map = getGameMap();
        for (let i = 0; i < mapWidth; i++)
            for (let j = 0; j < mapHeight; j++) {
                ctx.create_object(this, {
                        position: ctx.vector2(game_map[[i, j]].x * 32 * MapScale, game_map[[i, j]].y * 32 * MapScale),
                        size: ctx.vector2(32 * MapScale, 32 * MapScale),
                        sprite: getCellType(gameMap[[i, j]].cellTypeID).sprite,
                        layer: "cells",
                        color: "black"
                    },
                    function () {
                        this.update = function () {
                        }
                    });
                if (gameMap[[i, j]].decorID)
                    ctx.create_object(this, {
                            position: ctx.vector2(game_map[[i, j]].x * 32 * MapScale, game_map[[i, j]].y * 32 * MapScale),
                            size: ctx.vector2(32 * MapScale, 32 * MapScale),
                            sprite: getDecoration(gameMap[[i, j]].decorID).sprite,
                            layer: "decorations",
                        },
                        function () {
                            this.update = function () {
                            }
                        });
                if (gameMap[[i, j]].itemID)
                    objects_on_field[i.toString() + j] = ctx.create_object(this, {
                            position: ctx.vector2(game_map[[i, j]].x * 32 * MapScale, game_map[[i, j]].y * 32 * MapScale),
                            size: ctx.vector2(32 * MapScale, 32 * MapScale),
                            sprite: getItem(gameMap[[i, j]].itemID).sprite,
                            layer: "decorations",
                        },
                        function () {
                            this.update = function () {
                            }
                        });
                if (gameMap[[i, j]].monsterID)
                    objects_on_field[i.toString() + j] = ctx.create_object(this, {
                            position: ctx.vector2(game_map[[i, j]].x * 32 * MapScale, game_map[[i, j]].y * 32 * MapScale),
                            size: ctx.vector2(32 * MapScale, 32 * MapScale),
                            sprite: getMonster(gameMap[[i, j]].monsterID).sprite,
                            layer: "decorations",
                        },
                        function () {
                            this.update = function () {
                            }
                        });
            }
        for (let i = 0; i < players.length ; i++)
            players_on_field[i] = ctx.create_object(this, {
                    position: players[i].fieldCoordinates,
                    size: ctx.vector2(32 * MapScale, 32 * MapScale),
                    sprite: "assets/sprites/player.png",
                    layer: "main",
                },
                function () {
                    this.update = function () {
                    }
                });

        turn_tracker = new TurnTracker(() => {
        }, () => {
        });
        turn_tracker.start();
        ctx.view.move(players[turn_tracker.currentPlayerIndex].fieldCoordinates);
        window.addEventListener('keyup', function (e) {
            current_player = turn_tracker.currentPlayerIndex;
            if (current_player === turn_tracker.currentPlayerIndex) {
                let x = players[current_player].cell.x;
                let y = players[current_player].cell.y;
                switch (e.code) {
                    case 'KeyW':
                        players[current_player].move(game_map[[x,--y]]);
                        console.log(e.code)
                        break;
                    case 'KeyS':
                        players[current_player].move(game_map[[x,++y]]);console.log(e.code)
                        break;
                    case 'KeyD':
                        players[current_player].move(game_map[[++x,y]]);console.log(e.code)
                        break;
                    case 'KeyA':
                        players[current_player].move(game_map[[--x,y]]);console.log(e.code)
                        break;
                }
                ctx.view.move(players[current_player].fieldCoordinates);
            }
        })


    };
    this.update = function () {
        // TODO сделать слежку камерой

    };
    this.draw = function () {
    };
    this.exit = function () {
    };

})
ctx.start('my_scene')