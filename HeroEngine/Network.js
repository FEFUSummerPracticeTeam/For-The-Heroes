// Часть движка, осуществляющая взаимодействие с сервером

//Список лобби, получение: getLobbies()
let lobbyList;
//Сохраним ID этого игрока, чтобы не слать коллбеки на его ивенты, получение: getPlayerID()
let playerID;
//Также сохраним ID лобби, чтобы не передавать его каждый раз, получение: getLobbyID()
let lobbyID;
//Список игроков в лобби нам нужен, чтобы повесить на каждого соотв. коллбек, получение: getLobbyPlayers()
let lobbyPlayers;

//Создание лобби
//Принимает: Имя лобби, коллбек, принимающий объект созданного лобби по окончании его создания (id;name;creationDate)
//Возвращает: void
function createLobby(lobbyName, onLobbyCreatedListener) {
    lobbyID = database.ref().child('lobbies').push().key;

    let lobby = {
        id: lobbyID,
        name: lobbyName,
        creationDate: Date.now().toString(), //TODO: очистка лобби суточной и более давности
    };
    let updates = {}
    updates['lobbies/' + lobbyID] = lobby;
    database.ref().update(updates, () => {
        if (onLobbyCreatedListener !== undefined) {
            onLobbyCreatedListener(lobby);
        }
    });
}

//Подключение к лобби
//Принимает: имя игрока, ID лобби, коллбек изменения кол-ва игроков в лобби, принимающий список игроков в лобби(id:name)
//Возвращает: ID этого игрока
function joinLobby(playerName, lobbyID, onNewConnectionListener) {
    playerID = database.ref('players/' + lobbyID).push().key;
    let update = {}
    update['players/' + lobbyID + '/' + playerID] = playerName;
    database.ref().update(update);
    database.ref('players/' + lobbyID).on('value', (snapshot) => {
        lobbyPlayers = snapshot.val();
        if (onNewConnectionListener !== undefined) {
            onNewConnectionListener(lobbyPlayers);
        }
    });
    return playerID;
}

//Обновление списка лобби с сервера
//Принимает: коллбек, которому аргументом будет передан массив пар {name;id} - список лобби
//Возвращает: void
function refreshLobbies(onRefreshDoneListener) {
    let lobbyRef = database.ref('lobbies/');
    lobbyRef.once('value', (snapshot) => {
        lobbyList = snapshot.val() === null ? [] : snapshot.val();
        if (onRefreshDoneListener !== undefined) onRefreshDoneListener(getLobbies());
    }, (error) => {
        console.log(error)
    });
}

//Получение списка лобби
//Принимает: void
//Возвращает: массив пар {name,id} - список лобби
function getLobbies() {
    return lobbyList;
}

//Получение ID текущего лобби
//Принимает: void
//Возвращает: строку - ID текущего лобби
function getLobbyID() {
    return lobbyID;
}

//Получение ID текущего игрока
//Принимает: void
//Возвращает: строку - ID текущего игрока
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

//Приватная функция
function write(path, obj, onWriteDone) {
    database.ref(path).set(obj, onWriteDone === undefined ? undefined : onWriteDone);
}