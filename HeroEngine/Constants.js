//Часть движка, хранящая константы/enum

//(Model.js) Виды айтемов, позволяют понимать, что делать при их применении
//Все нестандартные виды айтемов имеют свой отдельный тип
const ItemTypes = {
    Armour: "Armour",
    Weapon: "Weapon",
    Magic: "Magic",
    HPHealing: "HPHeal",
    ManaHealing: "ManaHeal",
}

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

//(Network.js) Команды, согласно которым будет осуществляться парсинг команд в логе игры в БД
const commands = {
    //Пакет данных содержит cmdID,x,y
    Movement: 1,
    //Пакет данных содержит cmdID,itemID
    Item: 2,
    //Пакет данных содержит cmdID,ActionID?, data?
    Action: 3,
    //Пакет данных содержит cmdID
    Disconnected: 4,
    //Пакет данных с полем, содержит cmdID, field - специальным образом сериализованный массив поля
    Field: 5,
}