var http        = require('http');
var request     = require('request');
var mysql 	    = require('mysql');
var websocket   = require('ws');

// WebSocket-сервер на порту 8081
var webSocketServer = new websocket.Server({
    host: '192.168.25.57',
    port: 5482
});

webSocketServer.on('connection', function(ws) {

    console.log("Новое соединение");


    ws.on('message', function(message) {
        console.log('получено сообщение ' + message);
        var msg = JSON.parse(message);

        switch (msg.cmd) {
            case 'auth':
                let token = authorize(ws, msg.login, msg.pass);
                if (token != null) {
                    var res = 'ok';

                } else { var res = 'fail';
                    token = false }
                var answ = {res: res, cmd: msg.cmd, token: token};
                send_message(ws, answ);
                break;
            case 'msg':
                // проверить токен
                // принять сообщение в список
                // толкнуть всем сокетам новое сообщение
                if (check_token(msg.token)) {

                }
                break;
            default:
                var answ = {res: 'unknown', cmd: msg.cmd};
                send_message(ws, answ);
        }


    });

    ws.on('close', function() {
        console.log('Вебсокет закрыт');
        // от БД не отключаемся
        // dbc.end;
    });

});

// глобальная будет
var dbc = mysql.createConnection({
    host     : 'localhost',
    user     : 'chat_db_user',
    password : '9U7gVtKAybFu7y3z',
    database : 'chat_db'
});

dbc.connect(function(err) {
    if (err) throw err;
    console.log("Подключился к БД");
});

function query(ws, text) {
    var output;

    console.log('query: '+text);

    dbc.query( text, function(error, result){
        console.log('query result:');
        console.log(result);
        console.log(JSON.stringify(result));
        ws.send(JSON.stringify(result));
            console.log('inner result: '+result);
        }
    );

    /* connection.end();*/

    return output;
}

function send_message(ws, msg) {
    ws.send(JSON.stringify(msg));
}

function newtoken(user_id) {
    dbc.query( 'SELECT `id` FROM `users` WHERE login=\''+dbc.escape(login)+'\' and pass=\''+dbc.escape(pass)+'\' LIMIT 0,1');
}

function authorize(ws, login, pass) {

    dbc.query( 'SELECT `id` FROM `users` WHERE login='+dbc.escape(login)+' and pass='+dbc.escape(pass)+' LIMIT 0,1;' ,
            function(error, result, fields){
                if (error) throw error;
                if (result.length > 0) {
                    let user_id = result[0].id;
                    dbc.query('UPDATE sessions set active=0 where user_id='+dbc.escape(user_id));
                    dbc.query('INSERT INTO `sessions` (`user_id`, `active`, `date_created`, `token`) VALUES ('+dbc.escape(user_id)+', 1, NOW(), FLOOR(rand() * 10000000))');
                    dbc.query('SELECT token FROM `sessions` WHERE active=1 and user_id='+dbc.escape(user_id),
                        function(error2, result2) {
                        if (error2) throw error2;
                        if (result2.length>0) {
                            // парсим результат
                            let token = result2[0].token;
                            var res = 'unknown';
                            if (token != null) {
                                res = 'ok';

                            } else {
                                res = 'fail';
                                token = false
                            }


                            let answ = {res: res, cmd: 'auth', token: token};
                            //debug
                            //console.log(answ);
                            ws.send(JSON.stringify(answ));
                        }
                    });
                }
        }
    );

    // ничего не будем возвращать, ответ будет асинхронный из колбэка обращения к БД
}



