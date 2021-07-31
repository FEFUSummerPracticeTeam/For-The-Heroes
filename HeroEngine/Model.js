// Часть движка, содержащая абстракции для всех логических элементов игры

//Выбранное игроком имя
let playerName = ''
//Array{Player} на карте в порядке, определённым firebase'ом или же игроком (в случае ИИ)
let players = []
//Array типов айтемов, ключ - ID, инициализируется при вызове parseItems(), получать через getItem(id)
const itemTypeList = [];
//Array типов клеток, ключ - ID, инициализируется при вызове parseCells(), получать через getCellType(id)
const cellTypeList = [];
//Array типов декораций, ключ - ID, инициализацируется при вызове parseDecorations(), получать через getDecoration(id)
const decorTypeList = [];
//Array типов монстров, ключ - ID, инициализируется при вызове parseMonsters(), получать через getMonster(id)
const monsterTypeList = [];
//2D Array - массив всего поля игры, получение через getGameMap()
let gameMap = [];
//Быстрый способ получить есть ли в игре AI
let isAiGame = false;

//Функция, инициализирующая игру, должна вызываться на старте игровой комнаты
//Принимает: gameCallback - обработчик событий игры в соответствии с Constants.commands
//Возвращает: void
function gameInitialize(gameCallback) {
    //INIT
    isAiGame = false;
    //INIT
    if (isDebug) {
        doDebugGame();
    }
    parseItems();
    parseCells();
    parseDecorations();
    parseMonsters();
    let lobbyPlayers = getLobbyPlayers();
    if (shouldGenerateField())
        MapGenerator.generateGameMap();
    //Если игроки уже есть значит мы уже их сделали при получении карты
    if (players.length === 0) {
        for (let i = 0; i < lobbyPlayers.length; i++) {
            players[i] = new Player(lobbyPlayers[i].name, false);
        }
    }

    //Создание копий монстров для поля
    for (let i = 0; i < mapWidth; i++) {
        for (let j = 0; j < mapHeight; j++) {
            if (gameMap[i][j].monsterID !== undefined) {
                gameMap[i][j].monster = {};

                Object.assign(gameMap[i][j].monster, getMonster(gameMap[i][j].monsterID));
                Object.setPrototypeOf(gameMap[i][j].monster, Monster.prototype);

            }
        }
    }
    //Спаун AI
    if (lobbyPlayers.length <= 1) {
        for (let i = 1; i < lobbyPlayers.length + AIPlayerCount; i++) {
            players[i] = new Player('AI ' + i, true);
            isAiGame = true;
        }
    }
    //Если позиции ещё не заданы нужно расставить игроков
    if (players[0].cell === undefined)
        for (const player of players) {
            player.move(gameMap [randomRangeInt(0, mapWidth)][randomRangeInt(0, mapWidth)])
        }
    //Отправка пакета если мы сервер
    if (isAiGame === false && shouldGenerateField()) {
        let _playerPos = [];
        for (const player of players) {
            _playerPos.push(player.cell);
        }
        let serializedField = ''
        for (let i = 0; i < mapWidth; i++) {
            for (let j = 0; j < mapHeight; j++) {
                let cell = gameMap[i][j];
                serializedField += (`${cell.x}:${cell.y}:${cell.cellTypeID}:${cell.itemID !== undefined ? cell.itemID : ''}:${cell.decorID !== undefined ? cell.decorID : ''}:${cell.monsterID !== undefined ? cell.monsterID : ''}:`);
            }
        }
        makeEvent({
            cmdID: commands.Map,
            gameMap: serializedField,
            playerPos: JSON.stringify(_playerPos)
        });
        sync(true);
    }
    //Если мы не оффлайн, включаем синхронизации
    if (!isAiGame) {
        updateSyncValue();
    } else {
        //Если мы играем с AI, удаляем лобби, оно всё равно не нужно там
        cleanLobby(lobbyID);
    }
    addEventCallback(gameCallback);
}

class Player {
    fieldCoordinates = {x: undefined, y: undefined};

    //начальные значения потом изменю
    constructor(name, isAI) {
        this.name = name;
        this.level = 1;
        this.isdead = false;
        this.points = 1; //очки навыков
        this.experience = 0;
        this.maxHealth = 100;
        this.health = 100;
        this.maxMana = 50;
        this.mana = 100;
        this.defaultPower = 10; //физическая сила (без снаряжения)
        this.power = 100;
        this.armour = 0; //броня
        this.intelligence = 0; //магическая сила (процент, на который увеличивается урон от заклинаний)
        this.speed = 1;
        //this.agility = 1; //ловкость
        //this.fortune = 1;
        this.items = new Map(); //Map айтемов игрока, хранит количество по ключам объектов Item
        this.cell = undefined; //объект Cell, на котором стоит данный игрок
        this.isAI = isAI; //Является ли этот игрок ботом
    }


    /* ----------------------------------------------------------------
                           повышение уровня
    ---------------------------------------------------------------- */

    incrementLevel() {
        if (this.experience >= 1000) { //условие повышения уровня
            this.experience -= 1000;
            this.level++;
            this.points++;
            this.maxHealth += 20;
            this.health = this.maxHealth;
            this.maxMana += 5;
            this.mana = this.maxMana;
        }
    }

    getExperience(experience) {
        this.experience += experience;
        this.incrementLevel();
    }


    /* ----------------------------------------------------------------
                           смена снаряжения
    ---------------------------------------------------------------- */

    /*параметр armour указывается процентом при добавлении щита, 
    на этот процент сокращается влияние на здоровье от атаки противника, 
    сила при этом становится дефолтным (рукопашным) значением*/
    setArmour(armour) {
        this.armour = armour;
        this.power = this.defaultPower;
    }

    setPower(power) {
        this.power = power;
        this.armour = 0;
    }


    /* ----------------------------------------------------------------
                           игровые айтемы
    ---------------------------------------------------------------- */

    //функция получает процент, на который нужно увеличить текущее здоровье
    getHealth(percent) {
        this.health *= (1 + percent / 100);
        if (this.health > this.maxHealth) this.health = this.maxHealth;
    }

    //функция получает процент, на который нужно увеличить текущую ману
    getMana(percent) {
        this.mana *= (1 + percent / 100);
        if (this.mana > this.maxMana) this.mana = this.maxMana;
    }


    /* ----------------------------------------------------------------
                               действия
    ---------------------------------------------------------------- */

    isDead() {
        return this.health <= 0;
    }

    //функция получает силу противника и, в зависимости от наличия брони, уменьшает здоровье игрока
    getDamage(damage) {
        this.health -= damage * (100 - this.armour) / 100;
        this.isDead();
    }

    hitPlayer(damage, enemy) {
        enemy.getDamage(damage);
    }

    hitMonster(damage, monster) {
        monster.getDamage(damage, this);
    }

    //функция ускорения или замедления (percent < 0) игрока
    getSpeed(percent) {
        this.speed *= (1 + percent / 100);
    }

    //передвижение игрока на нужную клетку
    move(cell) {
        this.cell = cell;
        this.fieldCoordinates.x = this.cell.x * 32 * MapScale;
        this.fieldCoordinates.y = this.cell.y * 32 * MapScale;
        if (cell.itemID !== undefined && !this.isdead) {
            this.pickItem(cell.itemID)
        }
    }


    //Получение айтема игроком
    //Принимает: item - объект типа Item
    //Возвращает: void
    pickItem(item) {
        let localItem = this.items.get(item);
        if (localItem === undefined) {
            this.items.set(item, 1);
        } else {
            this.items.set(item, localItem + 1);
        }
    }


    /* ----------------------------------------------------------------
                              заклинания
    ---------------------------------------------------------------- */

    isEnoughMana(mana) {
        if (this.mana - mana > 0) {
            this.mana -= mana;
            return true;
        }
        return false; //выдать ошибку "не хватает маны"
    }

    increaseDueToIntelligence(value) {
        return value * (1 + this.intelligence / 100);
    }

    regeneration() {
        let health = this.increaseDueToIntelligence(10);
        this.getHealth(health);
    }

    fireball(enemy) {
        let damage = this.increaseDueToIntelligence(20);
        this.hitPlayer(damage, enemy);
    }


    /* ----------------------------------------------------------------
                          прокачка персонажа
    ---------------------------------------------------------------- */

    /* не понимаю, как будет работать прокачка персонажа:
    например, я качну здоровье, что тогда произойдет?
    1. оно каждый раз будет увеличиваться на фикс величину? тогда нужно установить максимум
    2. будет несколько уровней (сколько) прокачки здоровья, где каждый будет давать опр количество
    + если я один раз увеличила здоровье, следующее его увеличение будет стоит уже 2 очка (потом 3 и тд) или всё время 1?
    ! в любом случае нужно устанавливать верхнюю границу
    */

    // incrementMaxHealth() {
    //     this.maxHealth += 40;
    //     this.health = this.maxHealth;
    // }
    //
    // incrementIntelligence() {
    //     this.intelligence += 20;
    // }

}

class Monster {
    ID;
    name;
    type;
    health;
    damage;
    experience;
    sprite;

    isDead(player) {
        if (this.health > 0)
            return false;
        player.getExperience(this.experience);
        //монстр должен пропасть с поля
        return true;
    }

    getDamage(damage, player, magic_attack = false) {
        this.health -= damage;
        if (!magic_attack)
            this.hitPlayer(player); //пока что монстр просто атакует в ответ, естественно есть более интересные варианты
        this.isDead(player);
    }

    hitPlayer(player) {
        player.getDamage(this.damage);
    }
}


//Осуществляет ход ИИ
//Принимает: Player - за какого игрока делать ход
//Возвращает: void
function doAITurn(player) {
    //BFS
    let queue = new Queue();
    let visited = new Map();
    let has_weapon = check_for_weapon(player);
    queue.enqueue(player.cell);
    let targetCell = undefined;
    let current_target;
    let current_player = find_player(player)
    loop:
        while (!queue.isEmpty()) {
            let u = queue.dequeue();
            let mods = [[0, 1], [1, 0], [-1, 0], [0, -1]];
            for (let i = 0; i < 4; i++) {
                let x = u.x + mods[i][0];
                let y = u.y + mods[i][1];
                if (inBounds(x, y, mapWidth, mapHeight)) {
                    if (visited.get(gameMap[x][y]) === undefined) {
                        visited.set(gameMap[x][y], true);
                        queue.enqueue(gameMap[x][y]);
                        if (gameMap[x][y].itemID !== undefined) {
                            targetCell = gameMap[x][y];
                            current_target = 1;
                            break loop;
                        } else {
                            if (has_weapon) {
                                for (const p of players) {
                                    if(p.isdead) continue;
                                    if (p === player) continue;
                                    if (p.cell === gameMap[x][y]) {
                                        targetCell = gameMap[x][y];
                                        current_target = 2;
                                        break loop;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            //BFS END
        }
    for (let i = 0; i < player.speed; i++) {
        let cell = player.cell;
        if (cell.x !== targetCell.x) {
            player.move(gameMap[cell.x + (targetCell.x < cell.x ? -1 : 1)][cell.y]);
        } else if (cell.y !== targetCell.y) {
            player.move(gameMap[cell.x][cell.y + (targetCell.y < cell.y ? -1 : 1)]);
        }
        if (player.cell === targetCell) {
            if (!has_weapon)
                has_weapon = check_for_weapon(player)
        }
        if (player.health < player.maxHealth / 4) {
            let t = check_for_heal(player)
            if (t !== -1)
                getItem(i).useItem(player)
        }
        if(current_target===2 && Math.abs(cell.x-targetCell.x)<2 && Math.abs(cell.y-targetCell.y)<2 && has_weapon)
                getItem('1').useItem(players[current_player],{current_player})
                break;


    }
    //console.log("ИИ сдвинулся на " + player.cell.x + " " + player.cell.y);
}

function check_for_weapon(player) {
    for (let j of player.items.keys())
        if (j === 1)
            return true;
    return false
}

function check_for_heal(player) {
    let i = -1;
    for (let j of player.items.keys())
        if (j === 3) {
            i = j
            return i;
        }
}

function find_player(player) {
    for (let i = 0; i < players.length; i++) {
        if (players[i] === player)
            return i;
    }

}


//Абстракция айтемов игры
//В текущей имплементации Item = ItemType, т.е. в единый момент существует только один объект каждого айтема
//Пока что это нормально т.к. у нас нет индивидуальных особенностей у айтема, например прочности
class Item {
    ID;
    name;
    type;
    value;
    sprite;

    removeItem(player) {
        let cnt = player.items.get(this.ID);
        if (cnt !== 0) {
            if (cnt === 1) {
                player.items.delete(this.ID);
            } else {
                player.items.set(this.ID, cnt - 1);
            }
        }
    }

    //При его использовании мы делаем что-то в соответствии с его типом
    useItem(player, p) {
        switch (this.type) {
            case ItemTypes.Armour:
                player.setArmour(this.value);
                break;
            case ItemTypes.Weapon:
                for (let i of players)
                    if ((Math.abs(i.cell.x - players[p.current_player].cell.x) <= 1) &&
                        (Math.abs(i.cell.y - players[p.current_player].cell.y) <= 1) &&
                        i !== players[p.current_player]) {
                        i.getDamage(player.power);
                    }
                let x = player.cell.x;
                let y = player.cell.y;
                let mods = [[0, 0], [0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]]
                for (let i = 0; i < 9; i++) {
                    if (inBounds(x + mods[i][0], y + mods[i][1], mapWidth, mapHeight)) {
                        let cel = gameMap[x + mods[i][0]][y + mods[i][1]]
                        if (cel.monsterID !== undefined) {
                            cel.monster.getDamage(player.power, player);
                            return;
                        }
                    }
                }
                break;
            case ItemTypes.HPHealing:
                player.getHealth(this.value);
                this.removeItem(player);
                break;
            case ItemTypes.ManaHealing:
                player.getMana(this.value);
                this.removeItem(player);
                break;
            case ItemTypes.Magic:
                if (!player.isEnoughMana(this.value)) break;
                switch (this.name) {
                    case "Лечение":
                        player.regeneration();
                        break;
                    case "Файрбол":
                        callListeners(p.current_player, {
                            cmdID: commands.Item,
                            itemID: 4,
                            direction: p.direction,
                            player: player
                        })
                        break;
                    case "Создание оружия": //создает случайное оружие
                        let randomWeaponsList = itemTypeList.filter(item => item.type === "Weapon");
                        let randomWeapon = () => {
                            return randomWeaponsList[Math.floor(Math.random() * randomWeaponsList.length)]
                        }
                        player.pickItem(randomWeapon().ID)
                        break;
                }
                break;
        }
    }
}

//Класс клеток карты, используем ID потому, что так удобнее сериализовать
class Cell {
    itemID; // ID объекта Item, если на клетке лежит предмет
    decorID; // ID объекта декорации, если на клетке есть декорация
    monsterID; //ID объекта монстра, если на клетке есть монстр
    constructor(x, y, cellTypeID) {
        this.x = x;
        this.y = y;
        this.cellTypeID = cellTypeID; //ID CellType клетки
    }
}


//Класс, отслеживающий ходы в игре
class TurnTracker {
    turnCnt = -1;
    timePerTurn;
    timeLeft;
    currentInterval;
    currentPlayerIndex; //хранит индекс в массиве того, чей будет ход

    constructor(onTurnStartCallback, onTurnEndCallback) { //хранит индекс в массиве того, чей был/будет ход
        this.currentPlayerIndex = -1;
        this.onTurnStartCallback = onTurnStartCallback;
        this.onTurnEndCallback = onTurnEndCallback;
        this.timePerTurn = 6 / players.length;
    }

    start() {
        this.turnCnt++;
        this.currentPlayerIndex = this.turnCnt % players.length;
        this.timeLeft = this.timePerTurn;
        this.currentInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft === 0) {
                this.finishTurn();
            }
        }, 1000);
        this.onTurnStartCallback(this.currentPlayerIndex);
    }

    finishTurn() {
        window.clearInterval(this.currentInterval)
        let temp = this.currentPlayerIndex;
        this.currentPlayerIndex = -1;
        this.onTurnEndCallback(temp);
    }
}

//Класс, совмещающий в себе всё для генерации карты
class MapGenerator {
    //Генерация карты игрового поля
    static generateGameMap() {
        let heightMap = this.generateNoise(mapWidth, mapHeight, mapNoiseScale, heightWaves, sampleOffset);
        let moistureMap = this.generateNoise(mapWidth, mapHeight, mapNoiseScale, moistureWaves, sampleOffset);
        let heatMap = this.generateNoise(mapWidth, mapHeight, mapNoiseScale, heatWaves, sampleOffset);

        for (let x = 0; x < mapWidth; x++) {
            gameMap[x] = []
            for (let y = 0; y < mapHeight; y++) {
                gameMap[x][y] = new Cell(x, y, this.getBiomeID(heightMap[[x, y]], moistureMap[[x, y]], heatMap[[x, y]]));
            }
        }
        for (let i = 0; i < decorCount; i++) {
            let cell = gameMap[randomRangeInt(0, mapWidth)][randomRangeInt(0, mapHeight)];
            let cellType = getCellType(cell.cellTypeID);
            cell.decorID = cellType.decor[randomRangeInt(0, cellType.decor.length)];
        }
        //Сначала кладём всё, что в массиве item, потом - на рандом
        for (let i = 0; i < itemCount; i++) {
            let cell;
            while (true) {
                cell = gameMap[randomRangeInt(0, mapWidth)][randomRangeInt(0, mapHeight)];
                if (cell.decorID === undefined) break;
            }
            cell = gameMap[randomRangeInt(0, mapWidth)][randomRangeInt(0, mapHeight)];
            cell.itemID = i < itemTypeList.length ? i : itemTypeList[randomRangeInt(0, itemTypeList.length)].ID;
        }
        for (let i = 0; i < monsterCount; i++) {
            let cell;
            while (true) {
                cell = gameMap[randomRangeInt(0, mapWidth)][randomRangeInt(0, mapHeight)];
                if (cell.itemID === undefined && cell.decorID === undefined) break;
            }
            cell.monsterID = i < monsterTypeList.length ? i : monsterTypeList[randomRangeInt(0, monsterTypeList.length)].ID;
        }
    }

    //(private) Генерация карты перлиновского шума
    //Принимает: int width, int height, float scale, Array(Wave) Waves, Vector2 offset
    //Возвращает: 2D float Array
    static generateNoise(width, height, scale, waves, offset) {
        let noiseMap = [];
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                noiseMap[[x, y]] = 0;
                let sampleX = x * scale + offset.x;
                let sampleY = y * scale + offset.y;
                let norm = 0.0;
                for (const wave of waves) {
                    noiseMap[[x, y]] += wave.amplitude * noise(sampleX * wave.frequency + wave.seed, sampleY * wave.frequency + wave.seed);
                    norm += wave.amplitude;
                }
                noiseMap[[x, y]] /= norm;
            }
        }
        return noiseMap;
    }


    //(private) Получение ID биома в зависимости от выбранной точки на карте шумов
    static getBiomeID(height, moisture, heat) {
        let bestDiff;
        let bestDiffID;
        for (const cellType of cellTypeList.values()) {
            if (height >= cellType.value[0] && moisture >= cellType.value[1] && heat >= cellType.value[2]) {
                let diff = (height - cellType.value[0]) + (moisture - cellType.value[1]) + (heat - cellType.value[2]);
                if (bestDiffID === undefined) {
                    bestDiffID = cellType.ID;
                    bestDiff = diff;
                } else {
                    if (diff < bestDiff) {
                        bestDiff = diff;
                        bestDiffID = cellType.ID;
                    }
                }
            }
        }
        return bestDiffID === undefined ? cellTypeList[0].ID : bestDiffID;
    }

}

//Получение нужного типа клетки по ID
//Структуру объекта CellType можно посмотреть в CellTypes.json
//Принимает: ID - ID нужного типа клетки
//Возвращает: CellType - объект нужного типа клетки
function getCellType(ID) {
    return cellTypeList[ID];
}

//Получение декорации по ID
//Структуру объекта Decoration можно посмотреть в CellTypes.json
//Принимает: ID - ID декорации
//Возвращает: Decoration - объект нужной декорации
function getDecoration(ID) {
    return decorTypeList[ID];
}

//Получение монстра по ID
//Структуру объекта Monster можно посмотреть в Monsters.json
//Принимает: ID - ID монстра
//Возвращает: Monster - объект нужного монстра
function getMonster(ID) {
    return monsterTypeList[ID];
}

//Получение игрового поля
//Принимает: void
//Возвращает: 2D Array Cell - массив клеток игры
function getGameMap() {
    return gameMap;
}

//Получение айтема по ID
//Принимает: ID
//Возвращает: Item - объект нужного айтема
function getItem(ID) {
    return itemTypeList[ID];
}

//(private) Интерпретатор команд с firebase
function cmdHandler(playerIndex, ev) { //playerIndex - индекс игрока в массиве игроков
    //TODO
    if (playerIndex === getCurrentPlayerIndex()) return;
    switch (ev.cmdID) {
        case commands.Map:
            let mapTemp = ev.gameMap.split(':');
            for (let i = 0; i < mapTemp.length; i++)
                mapTemp[i] = parseInt(mapTemp[i]);
            let cnt = 0;
            for (let i = 0; i < mapWidth; i++) {
                gameMap[i] = [mapHeight]
                for (let j = 0; j < mapHeight; j++) {
                    gameMap[i][j] = new Cell(mapTemp[cnt], mapTemp[cnt + 1], mapTemp[cnt + 2]);
                    gameMap[i][j].itemID = !isNaN(mapTemp[cnt + 3]) ? mapTemp[cnt + 3] : undefined;
                    gameMap[i][j].decorID = !isNaN(mapTemp[cnt + 4]) ? mapTemp[cnt + 4] : undefined;
                    gameMap[i][j].monsterID = !isNaN(mapTemp[cnt + 5]) ? mapTemp[cnt + 5] : undefined;
                    cnt += 6;
                }
            }

            let pos = JSON.parse(ev.playerPos);
            for (let i = 0; i < lobbyPlayers.length; i++) {
                players[i] = new Player(lobbyPlayers[i].name, false);
                players[i].move(gameMap[pos[i].x][pos[i].y]);
            }
            break;
        case commands.Disconnected:
            if (lobbyPlayers[playerIndex].id !== playerID)
                alert('Игрок ' + players[playerIndex].name + ' покинул лобби...')
            cleanLobby(lobbyID);
            break;
        case commands.TurnEnd:
            break;
        case commands.Item:
            if(ev.p === undefined) return;
            getItem(ev.itemID).useItem(players[playerIndex], JSON.parse(ev.p));
            break;
        case commands.Movement:
            if (gameMap.length === 0) break;
            players[playerIndex].move(gameMap[ev.x][ev.y]);
            break;
        case commands.Action:
            break;
    }
}

//функция, фиксящая все несостыковки на время дебага
function doDebugGame() {
    lobbyPlayers = [{name: 'Player 1', id: '12345'}];
}

//(private) Парсинг JSON файла типов клеток
function parseCells() {
    parseJSON("JSON/CellTypes.json", (result) => {
        result.forEach((cellType) => {
            cellTypeList[cellType.ID] = cellType;
        });
    });
}

//(private) Парсинг JSON файла декораций
function parseDecorations() {
    parseJSON("JSON/Decorations.json", (result) => {
        result.forEach((decoration) => {
            decorTypeList[decoration.ID] = decoration;
        });
    });
}

//(private) Парсинг JSON файла монстров
function parseMonsters() {
    parseJSON("JSON/Monsters.json", (result) => {
        result.forEach((monster) => {
            monsterTypeList[monster.ID] = monster;
        });
    });
}

//(private) Парсинг JSON файла айтемов
function parseItems() {
    parseJSON("JSON/Items.json", (result) => {
        result.forEach((item) => {
            Object.setPrototypeOf(item, Item.prototype);
            itemTypeList[item.ID] = item;
        });
    });
}