// Часть движка, осуществляющая взаимодействие с сервером

//Команды, согласно которым будет осуществляться парсинг команд в логе игры в БД
const commands = {
    Movement: 1,
    Item: 2,
    Action: 3,
}

//Список лобби, получать с помощью getLobbies()
let lobbyList;

//Создаёт лобби
//Принимает: Имя лобби, коллбек с объектом созданного лобби по окончании его создания
//Возвращает: void
function createLobby(lobbyName, onLobbyCreated) {
    let lobbyID = database.ref().child('lobbies').push().key;

    let lobby = {
        id: lobbyID,
        name: lobbyName,
        creationDate: Date.now().toString(), //TODO: очистка лобби суточной и более давности
    };
    let updates = {}
    updates['lobbies/' + lobbyID] = lobby;
    database.ref().update(updates, (error) => {
        if (onLobbyCreated !== undefined) {
            onLobbyCreated(lobby);
        }
    });
}


//Подключение к лобби
//Принимает: пара {id;name} игрока, ID лобби, коллбек для присоединения новых людей, принимающий список игроков в лобби
//Возвращает: ID этого игрока
function joinLobby(playerName, lobbyID, newConnectionCallback) {
    let playerID = database.ref('players/' + lobbyID).push().key;
    let update = {}
    update['players/' + lobbyID + '/' + playerID] = playerName;
    database.ref().update(update);
    database.ref('players/' + lobbyID).on('value', (snapshot) => {
        if (newConnectionCallback !== undefined) {
            newConnectionCallback(snapshot.val());
        }
    });
    return playerID;
}

//Получение списка лобби
//Принимает: void
//Возвращает: массив пар {name,id} - список лобби
function getLobbies() {
    return lobbyList;
}

//Обновление списка лобби с сервера
//Принимает: коллбек, которому аргументом будет передан массив пар {name;id} - список лобби
//Возвращает: void
function refreshLobbies(callbackFunction) {
    let lobbyRef = database.ref('lobbies/');
    lobbyRef.once('value', (snapshot) => {
        lobbyList = snapshot.val() === null ? [] : snapshot.val();
        if (callbackFunction !== undefined) callbackFunction(getLobbies());
    }, (error) => {
        console.log(error)
    });
}

//Приватная функция
function write(path, obj, onWriteDone) {
    database.ref(path).set(obj, onWriteDone === undefined ? undefined : onWriteDone);
}