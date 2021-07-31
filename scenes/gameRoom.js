export function launch(ctx) {
    ctx.create_scene('gameRoom', function () {
        let waitingForSync = true;
        let turn_tracker;
        var show_inventory = false;
        var current_player;
        var selectedItem;
        this.init = function () {
            var objects_on_field = [];
            var players_on_field = [];
            selectedItem = 0;
            let offset = 0;
            gameInitialize((playerIndex, pack) => {
                switch (pack.cmdID) {
                    case commands.Map:

                }
            });
            current_player = getCurrentPlayerIndex();
            var game_map = getGameMap();
            for (let i = 0; i < mapWidth; i++)
                for (let j = 0; j < mapHeight; j++) {
                    ctx.create_object(this, {
                        position: ctx.vector2(game_map[i][j].x * 32 * MapScale, game_map[i][j].y * 32 * MapScale),
                        size: ctx.vector2(32 * MapScale, 32 * MapScale),
                        sprite: getCellType(gameMap[i][j].cellTypeID).sprite,
                        layer: "cells",
                        color: "black"
                    });
                    if (gameMap[i][j].decorID !== undefined)
                        ctx.create_object(this, {
                            position: ctx.vector2(game_map[i][j].x * 32 * MapScale, game_map[i][j].y * 32 * MapScale),
                            size: ctx.vector2(32 * MapScale, 32 * MapScale),
                            sprite: getDecoration(gameMap[i][j].decorID).sprite,
                            layer: "decorations",
                        });
                    if (gameMap[i][j].itemID !== undefined)
                        objects_on_field[i.toString() + j] = ctx.create_object(this, {
                            position: ctx.vector2(game_map[i][j].x * 32 * MapScale, game_map[i][j].y * 32 * MapScale),
                            size: ctx.vector2(32 * MapScale, 32 * MapScale),
                            sprite: getItem(gameMap[i][j].itemID).sprite,
                            layer: "decorations",
                        });
                    if (gameMap[i][j].monsterID !== undefined)
                        objects_on_field[i.toString() + j] = ctx.create_object(this, {
                                position: ctx.vector2(game_map[i][j].x * 32 * MapScale, game_map[i][j].y * 32 * MapScale),
                                size: ctx.vector2(24 * MapScale, 24 * MapScale),
                                sprite: getMonster(gameMap[i][j].monsterID).sprite,
                                layer: "decorations",
                            },
                            (p) => {
                                ctx.get_layer('text').draw_object({
                                    x: p.position.x,
                                    y: p.position.y - 5 * MapScale,
                                    height: 5,
                                    width: gameMap[i][j].monster.health / 10,
                                    color: "red",
                                    anchor: true
                                })
                                if (gameMap[i][j].monster.health <= 0)
                                    objects_on_field[i.toString() + j].destroy();
                            }
                        );
                }
            for (let i = 0; i < players.length; i++)
                players_on_field[i] = ctx.create_object(this, {
                        position: players[i].fieldCoordinates,
                        size: ctx.vector2(32 * MapScale, 32 * MapScale),
                        sprite: "assets/sprites/player.png",
                        layer: "main",

                    },
                    (p) => {
                        ctx.get_layer('text').draw_text({
                            text: players[i].name,
                            x: p.position.x,
                            y: p.position.y - 12 * MapScale,
                            size: 15,
                            color: "black",
                            anchor: true
                        })
                        ctx.get_layer('text').draw_object({
                            x: p.position.x,
                            y: p.position.y + 5 * MapScale,
                            height: 5,
                            width: (players[i].health) / 4,
                            color: "red",
                            anchor: true
                        })
                        ctx.get_layer('text').draw_object({
                            x: p.position.x,
                            y: p.position.y + 10 * MapScale,
                            height: 5,
                            width: (players[i].mana) / 4,
                            color: "blue",
                            anchor: true
                        })
                        if (players[i].cell.itemID !== undefined) {

                            players[i].cell.itemID = undefined;
                            objects_on_field[players[i].cell.x.toString() + players[i].cell.y].destroy();
                        }
                        if (players[i].health <= 0)
                            players_on_field[i].destroy();


                    }
                );
            turn_tracker = new TurnTracker(() => {
                if (players[turn_tracker.currentPlayerIndex].isAI === true) {
                    doAITurn(players[turn_tracker.currentPlayerIndex]);
                    turn_tracker.finishTurn();
                }
            }, () => {
                if (!isAiGame) {
                    sync();
                } else {
                    turn_tracker.start();
                }
            });
            ctx.create_object(this, {
                    text: '',
                    size: 50,
                    position: ctx.vector2(ctx.view.position.x + 500, ctx.view.position.y + 500),
                    layer: "text",
                    color: "black",
                    death_speed: -0.03,
                    opacity: 0.95,
                },
                (p) => {
                    p.text = waitingForSync ? 'Игроков готово: ' + syncCounter % players.length : turn_tracker.timeLeft;
                    p.opacity += p.death_speed
                    if ((p.opacity < 0.1) || (p.opacity > 0.96)) p.death_speed *= (-1);
                    p.position = ctx.vector2(ctx.view.position.x + ctx.size.x / 2, ctx.view.position.y + ctx.size.y / 20)
                }
            )
            ctx.view.move(players[current_player].fieldCoordinates, true);
            window.addEventListener('keyup', function (e) {
                    if (current_player === turn_tracker.currentPlayerIndex) {
                        let x = players[current_player].cell.x;
                        let y = players[current_player].cell.y;
                        switch (e.code) {
                            case 'KeyW':
                                if (y > 0)
                                    players[current_player].move(game_map[x][--y]);
                                break;
                            case 'KeyS':
                                if (y < mapHeight - 1)
                                    players[current_player].move(game_map[x][++y]);
                                break;
                            case 'KeyD':
                                if (x < mapWidth - 1)
                                    players[current_player].move(game_map[++x][y]);
                                break;
                            case 'KeyA':
                                if (x > 0)
                                    players[current_player].move(game_map[--x][y]);
                                break;
                            case 'KeyI':
                                show_inventory = !show_inventory;
                                break;
                            case 'ArrowUp':
                                if (selectedItem !== 0)
                                    selectedItem--;
                                break;
                            case 'ArrowDown':
                                if (selectedItem < players[current_player].items.size - 1)
                                    selectedItem++;
                                break;
                            case 'KeyE':
                                let enemy_near = false
                                let enemy;
                                if (show_inventory) {
                                    for (let i of players)
                                        if ((Math.abs(i.cell.x - players[current_player].cell.x) <= 1) &&
                                            (Math.abs(i.cell.y - players[current_player].cell.y) <= 1) &&
                                            i !== players[current_player]) {
                                            enemy_near = true;
                                            enemy = i;
                                        }
                                    let itemId = players[current_player].items.keys();
                                    for (let j = 0; j < selectedItem; j++) itemId.next();
                                    getItem(itemId.next().value).useItem(players[current_player], {enemy_near, enemy})
                                    selectedItem = 0;
                                }

                                break;


                        }
                        ctx.view.move(players[current_player].fieldCoordinates);
                    }
                }
            );
            if (!isAiGame) sync();
        };
        this.update = function () {
            if (waitingForSync) {
                if (syncCounter / players.length === turn_tracker.turnCnt + 2 || isAiGame) {
                    waitingForSync = false;
                    turn_tracker.start();
                }
            }
        };
        this.draw = function () {
            if (show_inventory) {
                ctx.get_layer('window').draw_object({
                    x: ctx.view.position.x,
                    y: ctx.view.position.y,
                    width: 200,
                    height: 300,
                    file: "assets/sprites/background_inventory.png"
                })
                let items = players[current_player].items.entries();
                let yOff = ctx.view.position.y + 50;
                let y = 0
                for (let i of items) {
                    let item_name = itemTypeList[i[0]].name
                    ctx.get_layer('window_text').draw_text({
                        x: ctx.view.position.x + 10 + 5,
                        y: yOff,
                        size: 15,
                        color: y === selectedItem ? 'red' : 'white',
                        text: item_name + " x" + i[1],
                    });
                    yOff += 30
                    y++;
                }
                ;

            }
        }
        this.exit = function () {
        };

    })
    ;
}