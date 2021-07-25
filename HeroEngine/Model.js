// Часть движка, содержащая абстракции для всех логических элементов игры

//Map типов айтемов, ключ - ID, инициализируется при вызове parseItems(), получать через getItems()
const itemList = new Map()
//Map типов клеток, ключ - ID, инициализируется при вызове parseCells(), получать через getCells()
const cellList = new Map()

class Player {
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
        this.items = []; //массив айтемов игрока, хранит ID
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
        player.items.push(this.ID);
    }
}

//Асинхронный парсинг JSON файла айтемов (функция должна выполняться где-то на старте)
//Принимает: void
//Возвращает: void
function parseItems() {
    parseJSON("JSON/Items.json", (result) => {
        result.forEach((item) => {
            Object.setPrototypeOf(item, Item.prototype);
            itemList[item.ID] = item;
        });
    });
}

//Получение всех айтемов
//Принимает: void
//Возвращает: Map объектов типа Item - все айтемы игры
function getItems() {
    return itemList;
}


//Класс, описывающий типы клеток поля
class CellType {
    ID;
    name;
    type;
    value;
    sprite;

    getEffect(player) {
        switch (this.type) {
            case CellTypes.NoEffect:
                break;
            case CellTypes.Slowdown:
                player.getSpeed(-this.value);
                break;
            case CellTypes.Acceleration:
                player.getSpeed(this.value);
                break;
            case CellTypes.Damage:
                player.getDamage(this.value);
                break;
            case CellTypes.HPHealing:
                player.getHealth(this.value);
                break;
            case CellTypes.ManaHealing:
                player.getMana(this.value);
                break;
            case CellTypes.Monster:
                // TODO
                break;
            case CellTypes.Secret: //рандомом выбирается любая клетка, кроме базовой ну и секретной
                // TODO  
                break;
        }
    }
}

//Генерация карты перлиновского шума
//Принимает: int width, int height, float scale, Array(Wave) Waves, Vector2 offset
//Возвращает: 2D float Array
function generateNoise(width, height, scale, waves, offset) {
    noise.seed(Math.random());
    let noiseMap = [];
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let sampleX = x * scale + offset.x;
            let sampleY = y * scale + offset.y;
            let norm = 0.0;
            for (const wave of waves) {
                noiseMap[x][y] += wave.amplitude * noise.perlin2(sampleX * wave.frequency + wave.seed, sampleY * wave.frequency + wave.seed);
                norm += wave.amplitude;
            }
            noiseMap[x][y] /= norm;
        }
    }
    return noiseMap;
}

class Wave {
    seed;
    frequency;
    amplitude;
}


//Асинхронный парсинг JSON файла типов клеток
//Принимает: void
//Возвращает: void
function parseCells() {
    parseJSON("JSON/Cells.json", (result) => {
        result.forEach((cell) => {
            Object.setPrototypeOf(cell, CellType.prototype);
            cellList[cell.ID] = cell;
        });
    });
}

//Получение всех клеток
//Принимает: void
//Возвращает: Map объектов типа CellType - все клетки игры
function getCells() {
    return cellList;
}