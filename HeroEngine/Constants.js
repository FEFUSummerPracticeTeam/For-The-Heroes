//Часть движка, хранящая константы/enum

//(Model) Размер карты
const mapWidth = 50;
const mapHeight = 50;

//Константа масштаба для генератора шума
const mapNoiseScale = 1;

//(Model) Виды айтемов, позволяют понимать, что делать при их применении
//Все нестандартные виды айтемов имеют свой отдельный тип
const ItemTypes = {
    Armour: "Armour",
    Weapon: "Weapon",
    Magic: "Magic",
    HPHealing: "HPHeal",
    ManaHealing: "ManaHeal",
}

//(Model) Виды всех клеток в игре
const CellTypes = {
    NoEffect: "NoEffect",
    Slowdown: "Slowdown",
    Acceleration: "Acceleration",
    Damage: "Damage",
    HPHealing: "HPHeal",
    ManaHealing: "ManaHeal",
    Monster: "Monster",
    Secret: "Secret",
}

//(Network) Команды, согласно которым будет осуществляться парсинг команд в логе игры в БД
const commands = {
    Movement: 1, //Пакет данных содержит cmdID,массив пар {x,y}, характеризующих передвижение
    Item: 2, //Пакет данных содержит cmdID,itemID
    Action: 3, //Пакет данных содержит cmdID,ActionID?, data?
    Disconnected: 4, //Пакет данных содержит cmdID
    Map: 5, //Пакет данных с полем, содержит cmdID, gameMap - специальным образом сериализованный массив карты игры
}