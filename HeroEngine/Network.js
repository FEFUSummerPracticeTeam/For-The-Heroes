// Часть движка, осуществляющая взаимодействие с сервером

//Список лобби, получение: getLobbies()
let lobbyList;
//ID этого игрока, чтобы не слать коллбеки на его ивенты, получение: getPlayerID()
let playerID;
//ID лобби, чтобы не передавать его каждый раз, получение: getLobbyID()
let lobbyID;
//Список игроков в лобби, чтобы повесить на каждого соотв. коллбек, получение: getLobbyPlayers()
let lobbyPlayers;

//Создание лобби
//Принимает: Имя лобби, коллбек, принимающий объект созданного лобби по окончании его создания {id;name;creationDate}
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
//Принимает: имя игрока, ID лобби, коллбек изменения кол-ва игроков в лобби, принимающий массив игроков в лобби{id;name}
//Возвращает: string - ID этого игрока
function joinLobby(playerName, lobbyID, onNewConnectionListener) {
    let playerRef = database.ref('players/' + lobbyID).push();
    playerID = playerRef.key;
    playerRef.set({name: playerName, id: playerID});
    database.ref('players/' + lobbyID).on('value', (snapshot) => {
        let response = snapshot.val();
        lobbyPlayers = response === null ? [] : Object.values(response);
        if (onNewConnectionListener !== undefined) {
            onNewConnectionListener(getLobbyPlayers());
        }
    });
    return playerID;
}

//Обновление списка лобби с сервера
//Принимает: коллбек, которому аргументом будет передан Array{name;id;creationDate} - список лобби
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
    varRef.once('value',(snapshot) => {
        let result = snapshot.val();
        if (result != null) {
            const oneDay = 24 * 60 * 60 * 1000;
            if ((timestamp - result.lastCleanTime) > oneDay) {
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
            varRef.set({lastCleanTime: timestamp});
        }
    });
}

//Получение списка лобби
//Принимает: void
//Возвращает: Array{name,id} - список лобби
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
//Возвращает: список игроков в лобби
function getLobbyPlayers() {
    return lobbyPlayers;
}

//Позволяет установить коллбек на события сервера
//Принимает: коллбек, ему на все новые ивенты будет передаваться 1) ID игрока 2) объект нового ивента
//Возвращает: void
function setEventCallback(onNewEventListener) {
    for (const prop in lobbyPlayers) {
        //проверка на то, что мы не итерируем поля прототипов и не делаем коллбек на этого игрока
        if (!lobbyPlayers.hasOwnProperty(prop) || prop.localeCompare(playerID) === 0) continue;
        database.ref('events/' + lobbyID + '/' + prop).on('child_added', (data) => {
            onNewEventListener(prop, data);
        });
    }
}

//Позволяет записать своё событие на сервер
//Принимает: пакет Object с данными согласно описанию в Constants.js
//Возвращает: void
function makeEvent(data) {
    let eventRef = database.ref('events/' + lobbyID + '/' + playerID).push();
    data.eventKey = eventRef.key;
    eventRef.set(data);
}

//Получает точную метку времени с сервера, чтобы не опираться на клиента
//Принимает: void
//Возвращает: string
function getTimestamp() {
    return firebase.database.ServerValue.TIMESTAMP;
}