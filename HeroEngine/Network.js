// Часть движка, осуществляющая взаимодействие с сервером

//Список лобби, получение: getLobbies()
let lobbyList = [];
//ID этого игрока, чтобы не слать коллбеки на его ивенты, получение: getPlayerID()
let playerID;
//Сам объект лобби, в котором мы находимся
let joinedLobby;
//ID лобби, чтобы не передавать его каждый раз, получение: getLobbyID()
let lobbyID;
//Список игроков в лобби, чтобы повесить на каждого соотв. коллбек, получение: getLobbyPlayers()
let lobbyPlayers;
//Список листенеров на ивенты с сервера
let eventCallbacks = [];
//Значение синхронизации
let syncCounter = 0;
//Массив текущих установленных коллбеков на игроков
let callbackRefs = [];

//Инициализация network-стека движка, должна выполняться сразу перед взаимодействием с онлайн частью
//Принимает:
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
            lobbyList.push(lobby);
            onLobbyCreatedListener(lobby);
        }
    });
}

//Подключение к лобби
//Принимает: имя игрока, ID лобби, коллбек на команды с сервера(помимо коллбека в Model),
// (опц) коллбек изменения кол-ва игроков в лобби, принимающий массив игроков в лобби{id;name}
//Возвращает: string - ID этого игрока
function joinLobby(playerName, lobbyToJoin, onNewCommandListener, onNewConnectionListener) {
    let playerRef = database.ref('players/' + lobbyToJoin).push();
    playerID = playerRef.key;
    playerRef.set({name: playerName, id: playerID});
    addEventCallback(cmdHandler);
    onNewCommandListener !== undefined ? addEventCallback(onNewCommandListener) : null;
    lobbyID = lobbyToJoin;
    bindOfflineAction();
    database.ref('players/' + lobbyToJoin).on('value', (snapshot) => {
        let response = snapshot.val();
        lobbyPlayers = response === null ? [] : Object.values(response);
        lobbyPlayers.sort((p1, p2) => {
            return p1.id.localeCompare(p2.id);
        });
        if (callbackRefs.length === 0) {
            for (const lobby of lobbyList) {
                if (lobby.id === lobbyID) {
                    joinedLobby = lobby;
                    break;
                }
            }
        }
        initEventCallback();
        if (onNewConnectionListener !== undefined) {
            onNewConnectionListener(getLobbyPlayers());
        }
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

//Выход из лобби
//Принимает: void
//Возвращает: void
function leaveLobby() {
    callbackRefs = []
    joinedLobby = undefined;
    if (lobbyPlayers.length === 1)
        cleanLobby(lobbyID);
    else {
        makeEvent({cmdID: 4});
        cleanPlayerData(lobbyID, playerID);
    }
    playerID = undefined;
    lobbyID = undefined;
}

//Очистка лобби по ID
//Принимает: lobbyID - ID лобби для удаления
//Возвращает: void
function cleanLobby(lobbyID) {
    let updates = {};
    updates['lobbies/' + lobbyID] = null;
    updates['players/' + lobbyID] = null;
    updates['sync/' + lobbyID] = null;
    updates['events/' + lobbyID] = null;
    firebase.database().ref().update(updates);
    refreshLobbies();
}

//Очистка данных игрока в лобби по ID
//Принимает: lobbyID, playerID - ID лобби для очистки
//Возвращает: void
function cleanPlayerData(lobbyID, playerID) {
    let updates = {};
    updates['lobbies/' + lobbyID + '/' + playerID] = null;
    updates['players/' + lobbyID + '/' + playerID] = null;
    updates['sync/' + lobbyID + '/' + playerID] = null;
    updates['events/' + lobbyID + '/' + playerID] = null;
    firebase.database().ref().update(updates);
}

//Очистка старых лобби (старее чем полчаса) (запускать только после хотя бы одного refreshLobbies())
//Принимает: void
//Возвращает: void
function cleanOldLobbies() {
    let needsWriting = false;
    let timestamp = getTimestamp();
    let varRef = database.ref('vars/lastCleanTime');
    varRef.once('value', (snapshot) => {
        let result = snapshot.val();
        if (result != null) {
            const oneDay = 0.5 * 60 * 60 * 1000;
            if ((timestamp - result) > oneDay) {
                needsWriting = true;
                for (const lobby of lobbyList) {
                    if ((timestamp - lobby.creationDate) > oneDay) {
                        cleanLobby(lobby.id);
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
    return getCurrentPlayerIndex() <= 0;
}

//Функция возвращает индекс текущего игрока
//Принимает: void
//Возвращает: number - номер текущего игрока
function getCurrentPlayerIndex() {
    if (isDebug) return 0
    for (let i = 0; i < getLobbyPlayers().length; i++) {
        if (lobbyPlayers[i].id.localeCompare(playerID) === 0) {
            return i;
        }
    }
    return -1;
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

//Инициализирует коллбек-систему событий игроков, должно вызываться при каждом изм. кол-ва участников
//Принимает: void
//Возвращает: void
function initEventCallback() {
    for (const callbackRef of callbackRefs) {
        database.ref(callbackRef).off();
    }
    callbackRefs = []
    for (const prop of lobbyPlayers) {
        //проверка на то, что мы не итерируем поля прототипов и не делаем коллбек на этого игрока
        if (prop.id === playerID) continue;
        let ref = 'events/' + lobbyID + '/' + prop.id;
        callbackRefs.push(ref);
        database.ref(ref).on('child_added', (data) => {
            for (let i = 0; i < lobbyPlayers.length; i++) {
                if (lobbyPlayers[i].id === prop.id) {
                    callListeners(i, data.val());
                }
            }
        });
    }
}

function sync(establishing) {
    let updates = {};
    updates[`sync/${lobbyID}/sync`] = establishing ? 0 : firebase.database.ServerValue.increment(1);
    firebase.database().ref().update(updates);
}

function updateSyncValue() {
    database.ref('sync/' + lobbyID + '/').on('child_changed', (data) => {
        syncCounter = data.val();
    });
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
    if (!isAiGame) {
        let eventRef = database.ref('events/' + lobbyID + '/' + playerID).push();
        eventRef.set(data);
    }
}

//Чистит прошлые ивенты с сервера для заданного игрока
//Принимает: playerID - строка ID игрока, чьи ивенты должны быть почищены
//Возвращает: void
function cleanCachedEvents(playerID) {
    database.ref('events/' + lobbyID + '/' + playerID).remove();
}

//Прикрепляет коллбек на случай, когда игрок попадёт в оффлайн
//Принимает: void
//Возвращает: void
function bindOfflineAction() {
    let ref = database.ref('events/' + lobbyID + '/' + playerID);
    let key = ref.push().key;
    database.ref('events/' + lobbyID + '/' + playerID + '/' + key).onDisconnect().set({
        cmdID: commands.Disconnected,
    });
}

//Получает точную метку времени с сервера, чтобы не опираться на клиента
//Принимает: void
//Возвращает: string
function getTimestamp() {
    return firebase.database.ServerValue.TIMESTAMP;
}