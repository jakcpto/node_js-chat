//var ws; // global websocket

//var reconntimer = setTimeout(function(){ ws = new WebSocket('ws://if1.promjet.ru:5482') }, 5000)

// via websocket
ws = new WebSocket('ws://if1.promjet.ru:5482');

ws.onopen = function() {
    //clearTimeout(reconntimer);

    hello_server();
    checkToken();
    // запроси историю сообщений
    getHistory();
};

ws.onmessage = function (e) {
    var answer = JSON.parse(e.data);
    console.log('Получено сообщение:'+answer);
    switch (answer.cmd) {
        case 'auth':
            // console.log(answer.token);
            let res = answer.res;
            let token = answer.token;
            if (res='ok') {
                setToken(token);
                getHistory();
                checkToken();
            } else {
                // хорошо бы сообщить что авторизация не удалась
                setToken(token)
            }


            break;
        case 'message':
            let user = answer.user;
            let udate = new Date(answer.date);
            // let date = answer.date;
            // let date = new Date();
            let date = $.format.date(udate, 'dd.MM.yy HH:mm');
            let message = answer.message;
            // console.log(message);
            add_message(user, date, message);
            break;
        default:
            console.log('unknown'+answer);
    }
};

ws.onclose = function (e) {
    if (e.wasClean) {
        console.log('Вебсокет закрыт нормально')
    } else {
        console.log('Вебсокет закрыт нечисто. Реконнект.');
        // reconnect
        //reconntimer = setTimeout(function(){ ws = new WebSocket('ws://if1.promjet.ru:5482') }, 5000)
    }
}

function init_ws(msg) {
    // via websocket
    //ws = new WebSocket('ws://if1.promjet.ru:5482');

    ws.onmessage = function (e) {
        var answer = JSON.parse(e.data);
        console.log('Получено сообщение:'+answer);
        switch (answer.cmd) {
            case 'auth':
                let res = answer.res;
                let token = answer.token;
                if (res='ok') { setToken(token)
                } else { setToken(token)}
                break;
            case 'message':
                let user = answer.user;
                let date = answer.date;
                let message = answer.message;
                add_message(user, date, message);
                break;
            default:
                console.log('unknown'+answer);
        }
    }

}

function setToken(token_val) {
    // console.log("Токен = "+token_val);
    //храним токен в хранилище

    localStorage.setItem("token", token_val);
    console.log("Текущий токен = "+localStorage.getItem("token"));
}


function getToken() {
    var x;
    // console.log('Читаем токен '+localStorage.getItem("token"));
    x = localStorage.getItem("token");
    if ((x == null) || (x == 'false')) {
        // если нет токена, то вернем false
        return false;
    } else {
// если есть, то вернем токен
        return x;

    }
}

function clearToken() {
    localStorage.removeItem("token");
    checkToken();
}

function getHistory(){
    let ltoken = getToken();
    let req = {cmd: 'history', token: ltoken};
    send_ws_message(ws, req);
}

function add_message(user, date, message) {
    let elem= document.createElement('div');
    let huser= document.createElement('strong');
    let hdate= document.createElement('i');
    let hmess= document.createElement('code');
    let sdate =toString(date);
    hdate.innerText = date;
    huser.innerText = " | "+ user +" > ";
    hmess.innerText = message;

    elem.appendChild(hdate);
    elem.appendChild(huser);
    elem.appendChild(hmess);
    // elem.innerText = "<strong>"+user+"</strong><i>"+sdate+"</i><code>"+message+"</code>";
    //$('chatroom').append("<strong>"+user+"</strong><i>"+sdate+"</i><code>"+message+"</code>"); //elem.innerText;

    var messageElem = document.createElement('div');
    messageElem.appendChild(document.createTextNode(message));
    document.getElementById('chatroom').appendChild(elem);

    // console.log('added '+message);
}

function checkToken() {
    var token = getToken();
    console.log('ChekToken '+token);

    if ((token == 'false') || (token == false)) { // no token
        // show
        $('#login_link').show();
        $('#info2-6').show(); // auth
        $('#content4-3').show(); // intro
        // hide
        $('#content2-4').hide(); // chatroom
        $('#content5-5').hide(); // buttons
        $('#logout_link').hide();
        console.log('No token');
    } else {
        // hide
        console.log('Token: ' + token);
        $('#login_link').hide();
        $('#info2-6').hide(); // auth
        $('#content4-3').hide(); // intro text
        // show
        $('#content2-4').show(); // chatroom
        $('#content5-5').show(); // buttons
        $('#logout_link').show();

        // set timer for infinite loop
        // of getting messages to chatroom

    }
}

function hello_server() {

    var cmd = 'hello';
    var token = getToken();

    if ((token == 'false') || (token == false)) { // no token
        console.log("No token found: " + cmd + token);
    } else {
        let msg = {cmd: cmd, token: token};

        send_ws_message(ws, msg);

        // console.log("Sent to server hello " + cmd + token);
    }
}

function auth() {

    var cmd = 'auth';
    var login = $('#login').val();
    var pass = $('#password').val();

    let msg = {cmd: cmd, login: login, pass: pass};

    send_ws_message(ws, msg);

    // console.log("Sent to server auth "+cmd+login+pass);

}

function out_message(){
    var msg = $('#message').val();
    let token = getToken();
    let cmd = 'msg';
    let snd = {cmd: cmd, token: token, msg: msg};

    send_ws_message(ws, snd);

    $('#message').val(''); // чистим поле ввода

    console.log("Sent to server msg "+snd);
}

function send_auth(e) {
    if (e.which == 13) {
        // отправляем серверу событие authorize
        auth();
    }
}

function send_message (event) {
    // если человек нажал Ctrl+Enter или Shift+Enter, то просто создаем новую строку.
    if (event.which == 13 && !event.ctrlKey && !event.shiftKey) {
        // отправляем серверу событие message
        out_message();
    }
}

function send_ws_message(ws, msg) {
    try {
        ws.send(JSON.stringify(msg));
    }
    catch (error) {
        console.log('Отправка не удалась. Реконнект');
        //reconntimer = setTimeout(function(){ ws = new WebSocket('ws://if1.promjet.ru:5482') }, 5000)
    }
}

// $(document).ready(function() {

    // отобразим форму и ссылки правильно
    checkToken();



//    }); // событие: документ готов
