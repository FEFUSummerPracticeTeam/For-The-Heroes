//Часть движка, осуществляющая полезный технический функционал

//Парсинг JSON файла
//Принимает: путь до файла в формате JSON/<>.json, коллбек, в который будет передан результат работы в виде массива Object
//Возвращает: void
function parseJSON(path, callback) {
    let request = new XMLHttpRequest();
    request.open("GET", getRootPath() + path);
    request.onload = ((res) => {
        callback(JSON.parse(request.response));
    });
    request.send(null);
}

//Возврат пути до коренной папки сайта
//Принимает: void
//Возвращает: строку - путь, со слешом на конце
function getRootPath() {
    return location.href.substring(0, location.href.lastIndexOf('/') + 1);
}