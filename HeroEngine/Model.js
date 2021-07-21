// Часть движка, содержащая абстракции для всех логических элементов игры

//массив айтемов, инициализируется при вызове parseItems(), получать через getItems()
const itemList = []

class Player {
    //начальные значения потом изменю
    constructor(name) {
        this.name = name;
        this.level = 1;
        this.points = 1; //очки навыков
        this.experience = 0;
        this.maxHealth = 100;
        this.health = 100;
        this.maxWisdom = 50; //мудрость, количество маны
        this.wisdom = 50;
        this.defaultPower = 10; //физическая сила (без снаряжения)
        this.power = 10;
        this.defaultIntelligence = 5; //магическая сила (без снаряжения)
        this.intelligence = 5; //магическая сила
        this.agility = 1; //ловкость
        this.speed = 1;
        this.fortune = 1;
        this.armour = 0; //броня
    }

    /*силы разграничены на "без снаряжения" и "со снаряжением" для того, чтоб, к примеру,
    можно было прокачать и использовать оружие для применения магической силы, но в то же время 
    иметь способность наносить значительный урон и от рукопашной физической*/


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
            this.maxWisdom += 5;
            this.wisdom = this.maxWisdom;
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
        this.intelligence = this.defaultIntelligence;
    }

    setPower(power) {
        this.power = power;
        this.intelligence = this.defaultIntelligence; //устанавливает дефолтное значение
        this.armour = 0;
    }

    setIntelligence(intelligence) {
        this.intelligence = intelligence;
        this.power = this.defaultPower; //устанавливает дефолтное значение
        this.armour = 0;
    }


    /* ----------------------------------------------------------------
                           игровые айтемы
    ---------------------------------------------------------------- */

    //функция получает процент, на который нужно увеличить текущее здоровье
    getHealth(percent) {
        this.health *= (1 + percent / 100);
    }

    //функция получает процент, на который нужно увеличить текущую ману
    getWisdom(percent) {
        this.wisdom *= (1 + percent / 100);
    }


    /* ----------------------------------------------------------------
                            действия игрока
    ---------------------------------------------------------------- */

    //функция получает силу противника и, в зависимости от наличия брони, уменьшает здоровье игрока
    getDamage(damage) {
        this.health -= damage * (100 - this.armour) / 100;
    }


    /* ----------------------------------------------------------------
                              заклинания
    ---------------------------------------------------------------- */

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

}

//Абстракция айтемов игры
class Item {
    ID;
    name;
    type;
    value;
    sprite;

    //При его использовании мы делаем что-то в соответствии с его типом
    useItem(){
        switch (this.type) {
            case ItemTypes.HPHealing:
                //TODO
                break;
            case ItemTypes.ManaHealing:
                //TODO
                break;
            case ItemTypes.Weapon:
                //TODO
                break;
        }
    }
}

//Асинхронный парсинг JSON файла айтемов (функция должна выполняться где-то на старте)
//Принимает: void
//Возвращает: void
function parseItems() {
    parseJSON("JSON/Items.json",(result)=>{
        result.forEach((item) => {
            Object.setPrototypeOf(item, Item.prototype);
            itemList.push(item);
        });
    });
}

//Получение всех айтемов
//Принимает: void
//Возвращает: массив объектов типа Item - все айтемы игры
function getItems() {
    return itemList;
}