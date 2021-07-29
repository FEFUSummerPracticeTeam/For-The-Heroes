// Часть движка, содержащая абстракции для всех логических элементов игры

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

//Функция, инициализирующая игру, должна вызываться на старте игровой комнаты
//Принимает: gameCallback - обработчик событий игры в соответствии с Constants.commands
//Возвращает: void
function gameInitialize(gameCallback) {
    if (isDebug) {
        doDebugGame();
    }
    parseItems();
    parseCells();
    parseDecorations();
    parseMonsters();
    if (shouldGenerateField()) {
        MapGenerator.generateGameMap();
        makeEvent({
            cmdID: commands.Map,
            gameMap: getGameMap()
        });
    }
    let lobbyPlayers = getLobbyPlayers();
    for (let i = 0; i < lobbyPlayers.length; i++) {
        players[i] = new Player(lobbyPlayers[i].name, false);
    }
    if (lobbyPlayers.length === 1) {
        for (let i = 1; i < AIPlayerCount; i++) {
            players[i] = new Player('AI ' + i, true);
        }
    }
    addEventCallback(gameCallback);
}

class Player {
    x; //Позиция в тайлах
    y;

    //начальные значения потом изменю
    constructor(name, isAI) {
        this.name = name;
        this.level = 1;
        this.points = 1; //очки навыков
        this.experience = 0;
        this.maxHealth = 100;
        this.health = 100;
        this.maxMana = 50;
        this.mana = 50;
        this.defaultPower = 10; //физическая сила (без снаряжения)
        this.power = 10;
        this.armour = 0; //броня
        this.intelligence = 0; //магическая сила (процент, на который увеличивается урон от заклинаний)
        this.speed = 1;
        //this.agility = 1; //ловкость
        //this.fortune = 1;
        this.items = new Map(); //Map айтемов игрока, хранит количество по ключам объектов Item
        this.cell = null; //объект Cell, на котором стоит данный игрок
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
        this.x = cell.x;
        this.y = cell.y;
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
        //enemy должен потратить действие, чтобы затушить себя
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

    getDamage(damage, player) {
        this.health -= damage;
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
    let d = 0;
    let visited = new Map();
    queue.enqueue(player.cell);
    while (!queue.isEmpty()) {
        let u = queue.dequeue();
        let xy = {x: -3, y: -3}
        for (let i = 0; i < 4; i++) {
            xy.y++;
            if (xy.y === 2) {
                xy.y = 0;
                xy.x++;
            }
            let x = u.x - xy.x;
            let y = u.y - xy.y;
            if (inBounds(x, y, mapWidth, mapHeight)) {
                if (gameMap[x][y].cell.item !== undefined) {

                } else if (gameMap[x][y].cell) {

                }
            }
        }
    }
    //BFS END
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
                players.items.delete(this.ID);
            } else {
                player.items.set(this.ID, players.item.get(this.ID) - 1);
            }
        }
    }

    //При его использовании мы делаем что-то в соответствии с его типом
    useItem(player) {
        switch (this.type) {
            case ItemTypes.Armour:
                player.setArmour(this.value);
                break;
            case ItemTypes.Weapon:
                player.setPower(this.value);
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
                        player.fireball(enemy);
                        break;
                    case "Молния": //у противника меньше времени на свой ход
                        //TODO
                        break;
                    case "Невидимость": //дается на рассчитываемое по формуле время и исчезает при атаке                    
                        //TODO
                        break;
                    case "Создание ловушки": //создает клетку с отрицательным эффектом
                        //TODO
                        break;
                    case "Создание оружия": //создает случайное оружие
                        //TODO
                        break;
                    ////////////////////////////////////////////////////////////////
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
    turnCnt = 0;
    timePerTurn;
    timeLeft;
    currentInterval;

    constructor(onTurnStartCallback, onTurnEndCallback) { //в обоих случаях передаётся ID того, чей был/будет ход
        this.onTurnStartCallback = onTurnStartCallback;
        this.onTurnEndCallback = onTurnEndCallback;
        this.timePerTurn = 60 / players.length;
    }

    start() {
        this.onTurnStartCallback(this.turnCnt % players.length);
        this.timeLeft = this.timePerTurn;
        this.currentInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft === 0) {
                this.finishTurn();
            }
        }, 1000);
    }

    finishTurn() {
        window.clearInterval(this.currentInterval)
        this.onTurnEndCallback(this.turnCnt % players.length);
        this.turnCnt++;
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
            for (let y = 0; y < mapHeight; y++) {
                gameMap[[x, y]] = new Cell(x, y, this.getBiomeID(heightMap[[x, y]], moistureMap[[x, y]], heatMap[[x, y]]));
            }
        }
        let decorCnt = randomRangeInt(minDecorCount, maxDecorCount);
        for (let i = 0; i < decorCnt; i++) {
            let cell = gameMap[[randomRangeInt(0, mapWidth), randomRangeInt(0, mapHeight)]];
            let cellType = getCellType(cell.cellTypeID);
            cell.decorID = cellType.decor[randomRangeInt(0, cellType.decor.length)];
        }
        //Сначала кладём всё, что в массиве item, потом - на рандом
        for (let i = 0; i < itemCount; i++) {
            let cell;
            while (true) {
                cell = gameMap[[randomRangeInt(0, mapWidth), randomRangeInt(0, mapHeight)]];
                if (cell.decorID === undefined) break;
            }
            cell = gameMap[[randomRangeInt(0, mapWidth), randomRangeInt(0, mapHeight)]];
            cell.itemID = i < itemTypeList.length ? i : itemTypeList[randomRangeInt(0, itemTypeList.length)].ID;
        }
        for (let i = 0; i < monsterCount; i++) {
            let cell;
            while (true) {
                cell = gameMap[[randomRangeInt(0, mapWidth), randomRangeInt(0, mapHeight)]];
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
            console.log(height);
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
function cmdHandler(Player, ev) { //Player - индекс игрока в массиве игроков
    //TODO
    switch (ev.cmdID) {
        case commands.Map:
            gameMap = ev.gameMap;
            break;
        case commands.Disconnected:
            break;
        case commands.TurnEnd:
            break;
        case commands.Item:
            break;
        case commands.Movement:
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