//Часть движка, хранящая константы/enum

//(Model) Размер карты
const mapWidth = 10;
const mapHeight = 10;

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

//Константы для генератора шума
const heightWaves = [{seed: 53, frequency: 5, amplitude: 5}, {seed: 199.36, frequency: 1, amplitude: 0.5}]
const moistureWaves = [{seed: 621, frequency: 0.03, amplitude: 1}]
const heatWaves = [{seed: 318.6, frequency: 0.04, amplitude: 1}, {seed: 329.7, frequency: 0.02, amplitude: 0.5}]
const mapNoiseScale = 1;
const sampleOffset = {x: 1, y: 1};