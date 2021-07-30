export function launch(ctx) {

    ctx.create_scene('gameRoom', function () {
        let turn_tracker;
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
                    (p)=>{
                        ctx.get_layer('text').draw_text({
                            text: players[i].name,
                            x: p.position.x,
                            y:p.position.y - 12*MapScale,
                            size:15,
                            color: "black",
                            anchor: true
                        })
                        ctx.get_layer('text').draw_object({
                            x: p.position.x,
                            y:p.position.y +5*MapScale,
                            height: 5,
                            width:(players[i].health)/4,
                            color:"red",
                            anchor: true
                        })
                        ctx.get_layer('text').draw_object({
                            x: p.position.x,
                            y:p.position.y +10*MapScale,
                            height: 5,
                            width:(players[i].mana)/4,
                            color:"blue",
                            anchor: true
                        })
                        if(players[i].cell.itemID!== undefined){
                            players[i].cell.itemID = undefined ;
                            objects_on_field[players[i].cell.x.toString()+players[i].cell.y].destroy();
                        }


                    }
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
            ctx.create_object(this,{
                    text:turn_tracker.timeLeft,
                    size: 50,
                    position:ctx.vector2(50,50),
                    layer:"text",
                    color:"black",
                    death_speed:-0.03,
                    opacity:0.95,
                },
                (p)=>{
                    p.text = turn_tracker.timeLeft;
                    p.opacity+=p.death_speed
                    if((p.opacity<0.1)||(p.opacity>0.96)) p.death_speed*=(-1);
                }
            )
            ctx.view.move(players[turn_tracker.currentPlayerIndex].fieldCoordinates);
            window.addEventListener('keyup', function (e) {
                if (current_player === turn_tracker.currentPlayerIndex) {
                    let x = players[current_player].cell.x;
                    let y = players[current_player].cell.y;
                    switch (e.code) {
                        case 'KeyW':
                            if (y > 0)
                                players[current_player].move(game_map[[x, --y]]);
                            console.log(e.code)
                            break;
                        case 'KeyS':
                            if (y < mapHeight - 1)
                                players[current_player].move(game_map[[x, ++y]]);
                            console.log(e.code)
                            break;
                        case 'KeyD':
                            if (x < mapWidth - 1)
                                players[current_player].move(game_map[[++x, y]]);
                            console.log(e.code)
                            break;
                        case 'KeyA':
                            if (x > 0)
                                players[current_player].move(game_map[[--x, y]]);
                            console.log(e.code)
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
}