var http        = require('http');
var wsio        = require('websocket.io');
var request     = require('request');
var mysql 	= require('mysql');

function query(text) {
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'chat_db_user',
  password : '9U7gVtKAybFu7y3z', 
  database : 'chat_db'
});

  connection.query(
    text,
    function(error, result, fields){
	var output = result;
    }
  );

connection.end();

return output;
}

function authorize(login, pass) {
    var user = query('SELECT id FROM `users` WHERE login=\"${login}\" and password=\'${pass}\'');
return user;
}

