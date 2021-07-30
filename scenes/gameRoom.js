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
                    });
                    if (gameMap[[i, j]].decorID !== undefined)
                        ctx.create_object(this, {
                            position: ctx.vector2(game_map[[i, j]].x * 32 * MapScale, game_map[[i, j]].y * 32 * MapScale),
                            size: ctx.vector2(32 * MapScale, 32 * MapScale),
                            sprite: getDecoration(gameMap[[i, j]].decorID).sprite,
                            layer: "decorations",
                        });
                    if (gameMap[[i, j]].itemID !== undefined)
                        objects_on_field[i.toString() + j] = ctx.create_object(this, {
                            position: ctx.vector2(game_map[[i, j]].x * 32 * MapScale, game_map[[i, j]].y * 32 * MapScale),
                            size: ctx.vector2(32 * MapScale, 32 * MapScale),
                            sprite: getItem(gameMap[[i, j]].itemID).sprite,
                            layer: "decorations",
                        });
                    if (gameMap[[i, j]].monsterID !== undefined)
                        objects_on_field[i.toString() + j] = ctx.create_object(this, {
                            position: ctx.vector2(game_map[[i, j]].x * 32 * MapScale, game_map[[i, j]].y * 32 * MapScale),
                            size: ctx.vector2(24 * MapScale, 24 * MapScale),
                            sprite: getMonster(gameMap[[i, j]].monsterID).sprite,
                            layer: "decorations",
                        });
                }
            for (let i = 0; i < players.length; i++)
                players_on_field[i] = ctx.create_object(this, {
                        position: players[i].fieldCoordinates,
                        size: ctx.vector2(32 * MapScale, 32 * MapScale),
                        sprite: "assets/sprites/player.png",
                        layer: "main",
                    },
                );

            turn_tracker = new TurnTracker(() => {
                if (players[turn_tracker.currentPlayerIndex].isAI === true) {
                    doAITurn(players[turn_tracker.currentPlayerIndex]);
                    turn_tracker.finishTurn();
                }
            }, () => {
                turn_tracker.start();
            });
            turn_tracker.start();
            ctx.view.move(players[turn_tracker.currentPlayerIndex].fieldCoordinates);
            window.addEventListener('keyup', function (e) {
                if (current_player === turn_tracker.currentPlayerIndex) {
                    let x = players[current_player].cell.x;
                    let y = players[current_player].cell.y;
                    switch (e.code) {
                        case 'KeyW':
                            players[current_player].move(game_map[[x, --y]]);
                            break;
                        case 'KeyS':
                            players[current_player].move(game_map[[x, ++y]]);
                            break;
                        case 'KeyD':
                            players[current_player].move(game_map[[++x, y]]);
                            break;
                        case 'KeyA':
                            players[current_player].move(game_map[[--x, y]]);
                            break;
                    }
                    ctx.view.move(players[current_player].fieldCoordinates);
                }
            });
        };
        this.update = function () {

        };
        this.draw = function () {
        };
        this.exit = function () {
        };

    });
    ctx.start('my_scene');
}