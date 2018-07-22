function setToken(cookie_value) {
var x,y;
x = $.cookie("token");
if(x == null) {
// если нет куки, то пишем её
$.cookie('token', cookie_value, { expires: 7000, path: '/' });
} else {
// если есть, то работать с ней
y = x.split(",");

}
}


function getToken() {
var x;
x = $.cookie("token");
if(x == null) {
// если нет куки, то вернем false
return false;
} else {
// если есть, то работать с ней
return x;

}
}

function checkToken() {
	var token = getToken();
	if (token != false) {
		// hide
		console.log('Token: '+token);
		$( '#login_link' ).hide();
		$( '#info2-6' ).hide(); // auth
		$( '#content4-3' ).hide(); // intro text
		// show
		$( '#content2-4' ).show(); // chatroom
		$( '#content5-5' ).show(); // buttons
		$( '#logout_link' ).show();
		
		// set timer for infinite loop 
		// of getting messages to chatroom

	} else { // no token
		// show
		$( '#login_link' ).show();
		$( '#info2-6' ).show(); // auth
		$( '#content4-3' ).show(); // intro
		// hide
		$( '#content2-4' ).hide(); // chatroom
		$( '#content5-5' ).hide(); // buttons
		$( '#logout_link' ).hide();
		console.log('No cookie');
	}
}


async function fetchAsync(url) {
 const response = await fetch(url);
 const data = await response.json();
 return data;
}

async function getUserPublicMessages(login) {
 const profile = await fetchAsync(`/user/${login}`);
 const messages = await fetchAsync(`/user/${profile.id}/last`);
 return messages.filter(message => message.isPublic);
}

//getUserPublicMessages('spiderman')
// .then(messages => show(messages));

function auth() {
	/*var req = $.ajax({
  	url: "http://if1.promjet.ru:5482",
	  data: {
        	'login': $( '#login' ).val(),
		'pass'	 : $( '#pass' ).val()
    		},
  	type: "POST",
	success: function(data){
          console.log('Response ${data}');
	},
	error: function(data) {
	 console.log('Error ${data}');
	}
	
	

 });    */

	// via websocket
	var ws = new WebSocket('ws://if1.promjet.ru:5482');
	var start = new Date();

	ws.onopen = function (data) {

	msg = 'my message here';
	var login = $( '#login' ).val();
	var login = $( '#password' ).val();
	ws.send(JSON.stringify(msg));
	};

	ws.onmessage = function (e) {

	var end = new Date();
	console.log('node.js - %d мс', (end.getTime()-start.getTime()) / 1000);
	};

}

function send_auth() {
	auth();
}

$(document).ready(function() {
    	checkToken();
	/* $( '#auth_form' ).onsubmit(send_auth()); */
	
	$( '#auth_form' ).on('click', '#auth_btn', 
		click(send_auth() )
	);

    });