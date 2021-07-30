export function launch(ctx) {
    let scene = ctx.create_scene('lobbySelectRoom', function () {
        let selectedLobby = 0;
        let offset = 0;
        this.init = () => {
            networkInit();
            ctx.create_object(this, {
                position: ctx.vector2(ctx.size.x / 2, ctx.size.y / 10),
                alignment: 'center',
                size: 50,
                text: 'Выберите лобби',
            });
            ctx.create_object(this, {
                position: ctx.vector2(ctx.size.x / 50, ctx.size.y / 7),
                size: 20,
                text: 'Используйте стрелки для навигации',
            });
            ctx.create_object(this, {
                position: ctx.vector2(ctx.size.x - ctx.size.x / 50, ctx.size.y / 7),
                size: 20,
                alignment: 'right',
                text: 'Нажмите C чтобы создать лобби',
            });
            ctx.create_object(this, {
                position: ctx.vector2(ctx.size.x - ctx.size.x / 50, ctx.size.y / 25),
                size: 20,
                alignment: 'right',
                text: 'Нажмите R чтобы обновить список',
            });
            window.addEventListener('keydown', (event) => {
                switch (event.key) {
                    case 'ArrowUp':
                        if (selectedLobby !== 0) {
                            selectedLobby--;
                        } else {
                            if (offset > 0) {
                                offset--;
                            }
                        }
                        break;
                    case 'ArrowDown':
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
                                ctx.set_scene('nameEnterRoom', 1);
                                break;
                        }
                }
            });
        };
        this.update = function () {
        };
        this.draw = function () {
            let yOff = ctx.size.y / 5;
            for (let i = 0; i < 10; i++, yOff += 50) {
                if (lobbyList[i + offset] === undefined) break;
                ctx.get_layer('text').draw_text({
                    x: ctx.size.x / 2,
                    y: yOff,
                    size: 30,
                    color: i === selectedLobby ? 'red' : 'black',
                    text: lobbyList[i + offset].name,
                    alignment: 'center'
                });
            }
        };
        this.exit = () => {
            window.onkeydown = null;
        };
    });
}