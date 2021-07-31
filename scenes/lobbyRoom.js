export function launch(ctx) {
    let scene = ctx.create_scene('lobbySelectRoom', function () {
        let selectedLobby;
        let offset;
        let joinedLobbyState;
        this.init = (args) => {
            offset = 0;
            selectedLobby = 0;
            joinedLobbyState = args !== undefined;
            if (!joinedLobbyState) networkInit();
            ctx.create_object(this, {
                position: ctx.vector2(ctx.size.x / 2, ctx.size.y / 10),
                alignment: 'center',
                size: 50,
                text: joinedLobbyState ? 'Лобби ' + joinedLobby.name : 'Выберите лобби',
            });
            !joinedLobbyState ? ctx.create_object(this, {
                position: ctx.vector2(ctx.size.x / 50, ctx.size.y / 7),
                size: 20,
                text: 'Используйте стрелки для навигации',
            }) : null;
            ctx.create_object(this, {
                position: ctx.vector2(ctx.size.x - ctx.size.x / 50, ctx.size.y / 7),
                size: 20,
                alignment: 'right',
                text: joinedLobbyState ? 'Нажмите C чтобы выйти из лобби' : 'Нажмите C чтобы создать лобби',
            });
            window.onkeydown = (event) => {
                switch (event.key) {
                    case 'ArrowUp':
                        if (!joinedLobbyState)
                            if (selectedLobby !== 0) {
                                selectedLobby--;
                            } else {
                                if (offset > 0) {
                                    offset--;
                                }
                            }
                        break;
                    case 'ArrowDown':
                        if (!joinedLobbyState)
                            if (selectedLobby !== 9) {
                                if (selectedLobby < lobbyList.length - 1) {
                                    selectedLobby++;
                                }
                            } else {
                                if (selectedLobby + offset < lobbyList.length - 1) {
                                    offset++;
                                }
                            }
                        break;
                    default:
                        switch (event.code) {
                            case 'KeyC':
                                if (!joinedLobbyState)
                                    ctx.set_scene('nameEnterRoom', true);
                                else {
                                    leaveLobby();
                                    ctx.set_scene('lobbySelectRoom');
                                }
                                break;
                            case 'Enter':
                                if (!joinedLobbyState) {
                                    let once = true;
                                    joinLobby(playerName, lobbyList[selectedLobby].id, undefined, () => {
                                        if (once) {
                                            once = false;
                                            ctx.set_scene('gameRoom', 'connected');
                                        }
                                    });
                                }
                        }
                }
            };
        };
        this.update = function () {
        };
        this.draw = function () {
            let toQuery = joinedLobbyState ? lobbyPlayers : lobbyList;
            let yOff = ctx.size.y / 5;
            for (let i = 0; i < 10; i++, yOff += 50) {
                if (toQuery[i + offset] === undefined) break;
                ctx.get_layer('text').draw_text({
                    x: ctx.size.x / 2,
                    y: yOff,
                    size: 30,
                    color: i === selectedLobby ? 'red' : 'black',
                    text: toQuery[i + offset].name,
                    alignment: 'center'
                });
            }
        };
        this.exit = () => {
            window.onkeydown = null;
        };
    });
}