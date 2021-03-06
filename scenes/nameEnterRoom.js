export function launch(ctx) {

    let scene = ctx.create_scene('nameEnterRoom', function () {
        let name;
        this.init = (args) => {
            name = '';
            let upperLabel = ctx.create_object(this, {
                size: 50,
                position: ctx.vector2(ctx.size.x / 2, ctx.size.y / 2),
                text: args === undefined ? 'Введите имя' : 'Введите название лобби',
                alignment: 'center',
                color: 'black'
            });
            ctx.create_object(this, {
                position: ctx.vector2(upperLabel.position.x, upperLabel.position.y + 100),
                size: 50,
                text: name,
                alignment: 'center',
                color: 'black'
            }, (node) => {
                node.text = name;
            });
            ctx.create_object(this, {
                position: ctx.vector2(upperLabel.position.x, upperLabel.position.y + 200),
                size: 50,
                text: "...и нажмите Enter",
                alignment: 'center',
                color: 'black'
            });
            window.onkeydown = (event) => {
                let key = event.key;
                if (name.length <= 8) name += key.length === 1 ? key : '';
                if (key === 'Backspace') {
                    name = name.slice(0, name.length > 0 ? name.length - 1 : 0);
                } else if (key === 'Enter') {
                    if (name.length !== 0) {
                        if (args === undefined) {
                            playerName = name;
                            ctx.set_scene('lobbySelectRoom');
                        } else {
                            createLobby(name, (lobby) => {
                                let once = true;
                                joinLobby(playerName, lobby.id, undefined, () => {
                                    if(once){
                                        ctx.set_scene('lobbySelectRoom', true);
                                        once = false;
                                    }
                                });
                            });
                        }
                    }
                }
            };
        };
        this.update = () => {
        };
        this.draw = () => {
        };
        this.exit = () => {
            window.onkeydown = null;
        };

    });
}