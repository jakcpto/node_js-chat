//var ws; // global websocket

// via websocket
ws = new WebSocket('ws://if1.promjet.ru:5482');

ws.onopen = function() {
		clearTimeout(reconntimer);
};

ws.onmessage = function (e) {
    var answer = JSON.parse(e.data);
    console.log('Получено сообщение:'+answer);
    switch (answer.cmd) {
        case 'auth':
        	console.log(answer.token);
            let res = answer.res;
            let token = answer.token;
            if (res='ok') { setToken(token)
            } else {
            	// хорошо бы сообщить что авторизация не удалась
            	setToken(token)
            }
            checkToken();
            break;
        case 'message':
            let user = answer.user;
            let date = new Date(parseInt(answer.date.substr(6)));
            let message = answer.message;
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
		var reconntimer = setTimeout(function(){ ws = new WebSocket('ws://if1.promjet.ru:5482') }, 5000)
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
                let date = new Date(parseInt(answer.date.substr(6)));
                let message = answer.message;
                add_message(user, date, message);
                break;
            default:
                console.log('unknown'+answer);
        }
    }

}

function setToken(token_val) {
	console.log("Токен = "+token_val);
	//храним токен в хранилище

    localStorage.setItem("token", token_val);
    console.log("Текущий токен = "+localStorage.getItem("token"));
}


function getToken() {
var x;
console.log('Читаем токен '+localStorage.getItem("token"));
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

function add_message(user, date, message) {
	let elem= document.createElement('div');
	let sdate =toString(date);
	elem.innerText = "<strong>"+user+"</strong><i>"+sdate+"</i><code>"+message+"</code>";
	$('chatroom').appendChild(elem);
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

function auth() {

	var cmd = 'auth';
	var login = $('#login').val();
	var pass = $('#password').val();

        let msg = {cmd: cmd, login: login, pass: pass};
        ws.send(JSON.stringify(msg));

	console.log("Sent to server "+cmd+login+pass);

}

function send_auth() {
	console.log('send auth');
	auth();
}

// $(document).ready(function() {

    // отобразим форму и ссылки правильно
	checkToken();

	// повесим функции на кнопки и линки
	$('#auth_form').on('submit', function() {
            send_auth()
        }
	);

	$('#auth_btn').on('click', auth());
	console.log("Document loaded function executed");

    $('#logout_link').on('click', clearToken());


    // по нажатию Enter в поле ввода пароля
    $('#password').onkeyup = function (e) {
        if (e.which == 13) {
            // отправляем серверу событие authorize
            auth();
        }
    };
// по нажатию Enter в поле ввода текста
    $('#message').onkeyup = function (e) {
        // если человек нажал Ctrl+Enter или Shift+Enter, то просто создаем новую строку.
        if (e.which == 13 && !e.ctrlKey && !e.shiftKey) {
            // отправляем серверу событие message
            send_message();
            $('#message').innerText = ''; // чистим поле ввода
        }
    };

//    }); // событие: документ готов
