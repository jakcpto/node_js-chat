var mysql 	    = require('mysql');
var websocket   = require('ws');

// WebSocket-сервер на порту 5482
var webSocketServer = new websocket.Server({
    host: '192.168.25.57',
    port: 5482
});

// здесь будем хранить активные соединения
var connections = {};

webSocketServer.on('connection', function(ws) {

    console.log("Новое соединение");
    // токен для поиска соединения в списке активных
    var token;


    ws.on('message', function(message) {
        console.log('получено сообщение ' + message);
        var msg = JSON.parse(message);

        switch (msg.cmd) {
            case 'auth': // авторизация клиента
                token = authorize(ws, msg.login, msg.pass);
                let res = 'ok'; // не пригодилась переменная
                                // проверки всё-равно в каждой вызываемой функции
                var answ = {res: res, cmd: msg.cmd, token: token};
                send_message(ws, answ);
                break;
            case 'msg': // прием сообщений
                // обработаем новое сообщение в чат
                recv_message(msg);
                break;
            case 'hello': // связываем авторизованного клиента и вебсокет
                token = msg.token;
                hello(ws, token);
                break;
            case 'history': // список старых сообщений
                token = msg.token;
                get_history_messages(ws, token);
                break;
            case 'whoisonline': // список пользователей онлайн
                token = msg.token;
                get_online_users(ws, token);
                break;
            case 'logout': // дизлогон
                token = msg.token;
                bye(token);
                // пока не close
                // ws.close();
                break;
            default: // без команды не должно быть
                var answ = {res: 'unknown', cmd: msg.cmd};
                send_message(ws, answ);
        }
    });

    ws.on('close', function() {
        // удалить соединение по токену
        bye(token);
        // console.log('Вебсокет закрыт');
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
    // было для отладки
    // console.log("Подключился к БД");
});

function send_message(ws, msg) {
    try {
        // попробуем отправить
        ws.send(JSON.stringify(msg));
    }
    catch (error) {
        // а клиент уже отвалился
        // console.log('Connection closed');
        // удалим из активных, токен не знаю.
        for (var ltoken in connections) {
            if (connections[ltoken] == ws) {
                delete connections[ltoken];
            }
        }
    }
}

function hello(ws, token){
    // запомним сокет авторизованного клиента
    connections[token] = ws;
}

function bye(token) {
    // кто-то вежливо отключился
    delete connections[token];
    dbc.query('UPDATE sessions set active=0 where token='+dbc.escape(token));
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

                            // добавим в список активных и авторизованных коннекшенов
                            hello(ws, token);

                            let answ = {res: res, cmd: 'auth', token: token};
                            //debug
                            // console.log(answ);
                            // отправка с обработкой отвалившихся сокетов
                            send_message(ws, answ);
                        }
                    });
                }
        }
    );

    // ничего не будем возвращать, ответ будет из колбэка обращения к БД
}

function recv_message(msg) {
    // принять перменные
    let token = msg.token;
    let message_text = msg.msg;
    let rtime = new Date();

    // проверить токен
    dbc.query( 'SELECT `user_id`, `session_id` FROM `sessions` WHERE active=1 and `token`='+dbc.escape(token), function(err, res1) {
        if (err) throw err;
        if (res1.length > 0) {
            let user_id = res1[0].user_id;
            let session_id = res1[0].session_id;
            // принять сообщение в список сообщений
            dbc.query('INSERT INTO `messages`(`sesson_id`, `user_id`, `date_time`, `message_text`) VALUES ('+dbc.escape(session_id)+','+dbc.escape(user_id)+',NOW(),'+dbc.escape(message_text)+');');
            // разослать всем клиентам новое сообщение
            // для этого надо унать как зовут этого юзера
            dbc.query('SELECT `username` FROM `users` WHERE `id`=?', user_id, function (err, res2) {
                if (res2.length > 0) {
                    let username = res2[0].username;
                    // толкнуть всем сокетам новое сообщение
                    push_new_chat_message(username, rtime, message_text);
                }
                }
            )

        }
    } );
}

function get_history_messages(ws, token) {
    // принять перменные

    // проверить токен
    dbc.query( 'SELECT `user_id`, `session_id` FROM `sessions` WHERE active=1 and `token`='+dbc.escape(token), function(err, res1) {
        if (err) throw err;
        if (res1.length > 0) {
            let user_id = res1[0].user_id;
            let session_id = res1[0].session_id;
            // запросить сообщения из базы
            dbc.query('select `message_text`, `messages`.`date_time`, `users`.`username` from `messages` left JOIN `users` on `messages`.`user_id` = `users`.`id` order by `messages`.`date_time`;', function (err, res2) {
                    if (err) throw err;
                    if (res2.length > 0) {
                        // по одному отправляем, в хронолоическом порядке как в сортироке запроса
                        for (i=0, len =  res2.length; i<len; i++) {
                            let answ = {cmd: 'message',  user: res2[i].username, date: res2[i].date_time, message: res2[i].message_text};
                            send_message(ws, answ);
                        }
                    }
                }
            )

        }
    } );
}

function get_online_users(ws, token) {
    // принять перменные

    // проверить токен
    dbc.query( 'SELECT `user_id`, `session_id` FROM `sessions` WHERE active=1 and `token`='+dbc.escape(token), function(err, res1) {
        if (err) throw err;
        if (res1.length > 0) {
            // юзер авторизован, отвечаем
            let user_id = res1[0].user_id;
            let session_id = res1[0].session_id;

            // составим список тоекнов из списка подключений в строку через запятую, потом в запрос вставим
            var keys = '';
            // var maxkey = connections.length-1; // минус это самое подключение
            // а пофиг, пусть запросившего тоже показывает

            for (key in connections) {
                keys = keys + key + ',';

                // если не надо запросившего показывать
                // if (connections[key] != ws)
                // но надо, хотя бы для отлладки
            }

            // уберем последнюю запятую
            keys = keys.substring(0,keys.length-1);

            console.log('keys '+keys);

            // запросить сообщения из базы
            console.log('SELECT `user_id`, `users`.`username` FROM `sessions` left join `users` on `sessions`.`user_id`=`users`.`id` WHERE `sessions`.`token` in ('+keys+');');
            dbc.query('SELECT `user_id`, `users`.`username` FROM `sessions` left join `users` on `sessions`.`user_id`=`users`.`id` WHERE `sessions`.`token` in ('+keys+');', function (err, res2) {
                    if (err) throw err;
                    if (res2.length > 0) {
                        let answ = {cmd: 'whoisonline',  users: res2};
                        console.log('online: '+answ);
                        send_message(ws, answ);
                    }
                }
            )

        }
    } );
}

function push_new_chat_message(username, rtime, message_text) {
    let answ = {cmd: 'message', user: username, date: rtime, message: message_text};
    // всем активным авторизованным соединениям
    for (var ltoken in connections) {
        send_message(connections[ltoken], answ);
        //console.log('Send message to '+ltoken+' from '+username);
    }
}