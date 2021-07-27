// Часть движка, осуществляющая взаимодействие с сервером

//Список лобби, получение: getLobbies()
let lobbyList;
//ID этого игрока, чтобы не слать коллбеки на его ивенты, получение: getPlayerID()
let playerID;
//ID лобби, чтобы не передавать его каждый раз, получение: getLobbyID()
let lobbyID;
//Список игроков в лобби, чтобы повесить на каждого соотв. коллбек, получение: getLobbyPlayers()
let lobbyPlayers;
//Список листенеров на ивенты с сервера
let eventCallbacks = [];

//Инициализация network-стека движка, должна выполняться сразу перед взаимодействием с онлайн частью
//Принимает: (опц.) коллбек на окончание инициализации
//Возвращает: void
function networkInit() {
    refreshLobbies();
    cleanOldLobbies();
}


//Создание лобби
//Принимает: Имя лобби,(опц.) коллбек, принимающий объект созданного лобби по окончании его создания {id;name;creationDate}
//Возвращает: void
function createLobby(lobbyName, onLobbyCreatedListener) {
    let lobbyRef = database.ref().child('lobbies').push();
    lobbyID = lobbyRef.key;

    let lobby = {
        id: lobbyID,
        name: lobbyName,
        creationDate: getTimestamp(),
    };
    lobbyRef.set(lobby, () => {
        if (onLobbyCreatedListener !== undefined) {
            onLobbyCreatedListener(lobby);
        }
    });
}

//Подключение к лобби
//Принимает: имя игрока, ID лобби, коллбек на команды с сервера(помимо коллбека в Model),
// (опц) коллбек изменения кол-ва игроков в лобби, принимающий массив игроков в лобби{id;name}
//Возвращает: string - ID этого игрока
function joinLobby(playerName, lobbyID, onNewCommandListener, onNewConnectionListener) {
    let playerRef = database.ref('players/' + lobbyID).push();
    playerID = playerRef.key;
    playerRef.set({name: playerName, id: playerID});
    database.ref('players/' + lobbyID).on('value', (snapshot) => {
        let response = snapshot.val();
        lobbyPlayers = response === null ? [] : Object.values(response);
        lobbyPlayers.sort((p1, p2) => {
            return p1.id.localeCompare(p2.id);
        });
        if (onNewConnectionListener !== undefined) {
            onNewConnectionListener(getLobbyPlayers());
        }
        addEventCallback(onNewCommandListener);
        addEventCallback(cmdHandler);
        bindOfflineAction();
    });
    return playerID;
}

//Обновление списка лобби с сервера
//Принимает: (опц.) коллбек, которому аргументом будет передан Array{name;id;creationDate} - список лобби
//Возвращает: void
function refreshLobbies(onRefreshDoneListener) {
    let lobbyRef = database.ref('lobbies/');
    lobbyRef.once('value', (snapshot) => {
        let response = snapshot.val();
        lobbyList = response === null ? [] : Object.values(response);
        if (onRefreshDoneListener !== undefined) onRefreshDoneListener(getLobbies());
    }, (error) => {
        console.log(error)
    });
}

//Очистка старых лобби (старее чем сутки) (запускать только после хотя бы одного refreshLobbies())
//Принимает: void
//Возвращает: void
function cleanOldLobbies() {
    let needsWriting = false;
    let timestamp = getTimestamp();
    let varRef = database.ref('vars/lastCleanTime');
    varRef.once('value', (snapshot) => {
        let result = snapshot.val();
        if (result != null) {
            const oneDay = 24 * 60 * 60 * 1000;
            if ((timestamp - result) > oneDay) {
                needsWriting = true;
                for (const lobby of lobbyList) {
                    if ((timestamp - lobby.creationDate) > oneDay) {
                        database.ref('lobbies/' + lobby.id).remove();
                    }
                }
            }
        } else {
            needsWriting = true;
        }
        if (needsWriting) {
            varRef.set(timestamp);
        }
    });
}


//Функция определения, кто является первым игроком, чтобы понять, кому придётся генерировать карту
//Принимает: void
//Возвращает: bool - является ли этот игрок первым
function shouldGenerateField() {
    return getCurrentPlayerIndex() === 0;
}

//Функция возвращает индекс текущего игрока
//Принимает: void
//Возвращает: number - номер текущего игрока
function getCurrentPlayerIndex() {
    return getLobbyPlayers().indexOf(item => item.id === playerID);
}

//Получение списка лобби
//Принимает: void
//Возвращает: Array{name,id,creationDate} - список лобби
function getLobbies() {
    return lobbyList;
}

//Получение ID текущего лобби
//Принимает: void
//Возвращает: string - ID текущего лобби
function getLobbyID() {
    return lobbyID;
}

//Получение ID текущего игрока
//Принимает: void
//Возвращает: string - ID текущего игрока
function getPlayerID() {
    return playerID;
}

//Получение списка игроков в лобби
//Принимает: void
//Возвращает: Array{name,id} - список игроков в лобби
function getLobbyPlayers() {
    return lobbyPlayers;
}

//Инициализирует коллбек-систему событий игроков
//Принимает: void
//Возвращает: void
function initEventCallback() {
    for (const prop in lobbyPlayers) {
        //проверка на то, что мы не итерируем поля прототипов и не делаем коллбек на этого игрока
        if (!lobbyPlayers.hasOwnProperty(prop) || prop.localeCompare(playerID) === 0) continue;
        database.ref('events/' + lobbyID + '/' + prop).on('child_added', (data) => {
            let i = getLobbyPlayers().indexOf(item => item.id === prop);
            callListeners(i, data);
        });
    }
}

//Позволяет вызвать все листенеры ивентов со своими параметрами
//Принимает: i - индекс игрока, осущ. действие, data - пакет данных действия
//Возвращает: void
function callListeners(i, data) {
    for (const callback of eventCallbacks) {
        callback(i, data);
    }
}

//Позволяет установить коллбек на события сервера
//Принимает: коллбеки, им на все новые ивенты будут передаваться 1) Индекс игрока в массиве 2) объект нового ивента
//Возвращает: void
function addEventCallback(callback) {
    eventCallbacks.push(callback);
}

//Позволяет записать своё событие на сервер
//Принимает: пакет Object с данными согласно описанию в Constants.js
//Возвращает: void
function makeEvent(data) {
    let eventRef = database.ref('events/' + lobbyID + '/' + playerID).push();
    data.eventKey = eventRef.key;
    eventRef.set(data);
}

//Чистит свои прошлые ивенты с сервера, должно выполняться по окончании хода
//Принимает: void
//Возвращает: void
function cleanCachedEvents() {
    database.ref('events/' + lobbyID + '/' + playerID).remove();
}

//Прикрепляет коллбек на случай, когда игрок попадёт в оффлайн
//Принимает: void
//Возвращает: void
function bindOfflineAction() {
    database.ref('events/' + lobbyID + '/' + playerID).onDisconnect().push().set({
        cmdID: commands.Disconnected,
    });
}

//Получает точную метку времени с сервера, чтобы не опираться на клиента
//Принимает: void
//Возвращает: string
function getTimestamp() {
    return firebase.database.ServerValue.TIMESTAMP;
}