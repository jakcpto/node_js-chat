var http        = require('http');
var request     = require('request');
var mysql 	= require('mysql');
var WebSocketServer = new require('ws');

// подключенные клиенты
var clients = {};

// WebSocket-сервер на порту 8081
var webSocketServer = new WebSocketServer.Server({
    host: '192.168.25.57',
    port: 5482
});

webSocketServer.on('connection', function(ws) {

    var id = Math.random();
    clients[id] = ws;
    console.log("новое соединение " + id);

    ws.on('message', function(message) {
        console.log('получено сообщение ' + message);
        var msg = JSON.parse(message);

        switch (msg.cmd) {
            case 'auth':
                var login = msg.login;
                var pass = msg.pass;
                var token = authorize(login, pass);
                if (token != null) {
                        var res = 'ok';

                } else { var res = 'fail';
                         token = false }
                var answ = {res: res, cmd: msg.cmd, token: token};
                ws.send(JSON.stringify(answ));
                break;
            default:
                var answ = {res: 'unknown', cmd: msg.cmd};
                ws.send(JSON.stringify(answ));
        }


        for (var key in clients) {
            clients[key].send(message);
            console.log(key+message);
        }
    });

    ws.on('close', function() {
        console.log('соединение закрыто ' + id);
        delete clients[id];
    });

});

async function query(text) {
    var output;

    var connection = mysql.createConnection({
    host     : 'localhost',
     user     : 'chat_db_user',
    password : '9U7gVtKAybFu7y3z',
     database : 'chat_db'
    });

  console.log('text: '+text);

  connection.query(
    text,
    function(error, result, fields){
	output = result;
	console.log('inner result: '+result);
    }
  );

connection.end();

return output;
}

function authorize(login, pass) {
    var user = await query('SELECT id FROM `users` WHERE login=\"'+login+'\" and password=\"'+pass+'\" LIMIT 1,1');
    console.log("user "+user);
    return user;
}

