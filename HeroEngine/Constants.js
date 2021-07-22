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

//(Network.js) Команды, согласно которым будет осуществляться парсинг команд в логе игры в БД
const commands = {
    Movement: 1,
    Item: 2,
    Action: 3,
}