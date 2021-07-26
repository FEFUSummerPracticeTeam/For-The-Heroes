// Часть движка, содержащая абстракции для всех логических элементов игры

//Array игроков на карте в порядке, определённым firebase'ом или же игроком (в случае ИИ)
let players = []
//Array типов айтемов, ключ - ID, инициализируется при вызове parseItems(), получать через getItem(id)
const itemTypeList = [];
//Array типов клеток, ключ - ID, инициализируется при вызове parseCells(), получать через getCellType(id)
const cellTypeList = [];
//Array типов декораций, ключ - ID, инициализацируется при вызове parseDecorations(), получать через getDecoration(id)
const decorTypeList = [];
//2D Array - массив всего поля игры, получение через getGameMap()
const gameMap = [];

//Функция, инициализирующая игру, должна вызываться на старте игровой комнаты
//Принимает: void
//Возвращает: void
function gameInitialize() {
    parseItems();
    parseCells();
    parseDecorations();
}

class Player {
    x; //Позиция в тайлах
    y;

    //начальные значения потом изменю
    constructor(name) {
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
        this.agility = 1; //ловкость
        this.speed = 1;
        this.fortune = 1;
        this.items = new Map(); //Map айтемов игрока, хранит количество по ключам объектов Item
        this.cell = null; //объект Cell, на котором стоит данный игрок
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
        this.health > 0 ? false : true;
    }

    //функция получает силу противника и, в зависимости от наличия брони, уменьшает здоровье игрока
    getDamage(damage) {
        this.health -= damage * (100 - this.armour) / 100;
        this.isDead();
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

    regeneration() {
        this.getHealth(10);
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

//Абстракция айтемов игры
//В текущей имплементации Item = ItemType, т.е. в единый момент существует только один объект каждого айтема
//Пока что это нормально т.к. у нас нет индивидуальных особенностей у айтема, например прочности
class Item {
    ID;
    name;
    type;
    value;
    sprite;

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
                break;
            case ItemTypes.ManaHealing:
                player.getMana(this.value);
                break;
            case ItemTypes.Magic:
                if (!player.isEnoughMana(this.value)) break;
                switch (this.name) {
                    case "Регенерация":
                        player.regeneration();
                        break;
                    case "Невидимость":
                        //TODO
                        break;
                    ////////////////////////////////////////////////////////////////
                }
                break;
        }
    }
}

//Получение айтема по ID
//Принимает: ID
//Возвращает: Item - объект нужного айтема
function getItem(ID) {
    return itemTypeList[ID];
}

//Класс клеток карты, используем ID потому, что так удобнее сериализовать
class Cell {
    itemID; // ID объекта Item, если на клетке лежит предмет
    decorID; // ID объекта декорации, если на клетке есть декорация
    constructor(x, y, cellTypeID) {
        this.x = x;
        this.y = y;
        this.cellTypeID = cellTypeID; //ID CellType клетки
    }
}

//Генерация карты игрового поля
//Принимает: void
//Возвращает: void
function generateGameMap() {
    let heightMap = generateNoise(mapWidth, mapHeight, mapNoiseScale, heightWaves, sampleOffset);
    let moistureMap = generateNoise(mapWidth, mapHeight, mapNoiseScale, moistureWaves, sampleOffset);
    let heatMap = generateNoise(mapWidth, mapHeight, mapNoiseScale, heatWaves, sampleOffset);

    for (let x = 0; x < mapWidth; x++) {
        for (let y = 0; y < mapHeight; y++) {
            gameMap[[x, y]] = new Cell(x, y, getBiomeID(heightMap[[x, y]], moistureMap[[x, y]], heatMap[[x, y]]));
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
        cell.itemID = i < itemTypeList.length ? i : itemTypeList[randomRangeInt(0, itemTypeList.length)].ID;
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

//Получение игрового поля
//Принимает: void
//Возвращает: 2D Array Cell - массив клеток игры
function getGameMap() {
    return gameMap;
}

//(private) Генерация карты перлиновского шума
//Принимает: int width, int height, float scale, Array(Wave) Waves, Vector2 offset
//Возвращает: 2D float Array
function generateNoise(width, height, scale, waves, offset) {
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
function getBiomeID(height, moisture, heat) {
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

//(private) Асинхронный парсинг JSON файла типов клеток
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

//(private) Асинхронный парсинг JSON файла айтемов
function parseItems() {
    parseJSON("JSON/Items.json", (result) => {
        result.forEach((item) => {
            Object.setPrototypeOf(item, Item.prototype);
            itemTypeList[item.ID] = item;
        });
    });
}