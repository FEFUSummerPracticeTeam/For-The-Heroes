//Часть движка, хранящая константы/enum

//Переменная, кроющая часть ошибок на время дебага
const isDebug = false;

//(Model) Парметры карты
const mapWidth = 50;
const mapHeight = 50;
const decorCount = (mapHeight * mapWidth) / 18;
const itemCount = (mapHeight * mapWidth) / 50;
const monsterCount = 10;
const AIPlayerCount = 1;
const MapScale = 1;

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
    Map: 5, //Пакет данных содержит cmdID, gameMap - сериализованный массив карты игры, служит началом игры
    TurnEnd: 6, //Пакет данных содержит cmdID
    Internal: 7, //Пакет данных для использования внутри приложения
}

//(Model) Константы для генератора шума
const heightWaves = [{seed: 53, frequency: 0.05, amplitude: 1}, {seed: 199.36, frequency: 0.1, amplitude: 0.5}]
const moistureWaves = [{seed: 621, frequency: 0.03, amplitude: 1}]
const heatWaves = [{seed: 318.6, frequency: 0.04, amplitude: 1}, {seed: 329.7, frequency: 0.02, amplitude: 0.5}]
const mapNoiseScale = 1.5;
const sampleOffset = {x: 0, y: 0};