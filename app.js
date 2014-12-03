
var app = require('http').createServer(handler);
var mysql = require('mysql');
var io = require('socket.io')(app);
var fs = require('fs');
var _ = require('underscore');

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'whoelse',
	port: 3306
});

var sockets = [];

var POOLING_INTERVAL = 3000;
var poolingTimer;

connection.connect(function (err) {
	if(err)
		console.log(err);
});

poolingTimer = setTimeout(poolingLoop, POOLING_INTERVAL);

app.listen(8080);

function handler(req, res) {
	fs.readFile(__dirname + '/client.js', function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading client.js');
		}

		res.writeHead(200);
		res.end(data);
	});
}

function formatPath(path) {
	return path.replace(/\d/, '{id}').replace(/\d/g, '');
}

function getRoom(path) {
	path = formatPath(path);
	if(path.charAt(path.length - 1) == '/' && path.length > 1) {
		path = path.substr(0, path.length - 1); // remove the / character at the end of the string
	}
	return path;
}

function getMembers(room, username) {
	var members = [];
	var clients = io.sockets.adapter.rooms[room];
	for(var client in clients) {
		var socket = io.sockets.connected[client];
		if(socket.username == username)
			continue;
		members.push(socket.username);
	}
	return members;

}

function poolingLoop() {
	if(sockets.length > 0) {
		var notifications = {};
		var userIDs = '(' + _.pluck(sockets, 'userID').join(',') + ')';
		var ids = [];
		var q = "SELECT * FROM messages_board WHERE notified = 0 AND user_id IN " + userIDs;
		// var q = "SELECT * FROM messages_board WHERE notified = 0";
		// console.log(q);
		var query = connection.query(q);
		query.on('error', function (err) {
			console.log(err);
		});

		query.on('result', function (result) {
			var userIndex = 'user' + result.user_id;
			if(typeof notifications[userIndex] == 'undefined') {
				notifications[userIndex] = [];
			}
			notifications[userIndex].push(result);
			ids.push(result.id);
		});

		query.on('end', function () {
	        if(sockets.length > 0) { // at least one client is online
	        	notifyUsers(notifications);
	        }
	        // mark notifications as read
	        if(ids.length > 0)
	        	connection.query("UPDATE messages_board SET notified = 1 WHERE id IN (" + ids.join(',') + ")");
		});
	}
	poolingTimer = setTimeout(poolingLoop, POOLING_INTERVAL);
}

function notifyUsers(notifications) {
	_.each(sockets, function (socket) {
		var userIndex = 'user' + socket.userID;
		var notification = notifications[userIndex];
		//console.log(notification);
		if(notification)
			socket.emit('notification', notification);
	});
}

io.on('connection', function (socket) {


	// new viewer arrives
	socket.on('register', function (data) {
		var username = data.username;
		var room = getRoom(data.pathname);
		//console.log(username + ' is in room ' + room);

		socket.username = username;
		socket.room = room;
		socket.userID = data.id;

		sockets.push(socket);
		//console.log('new viewer');

		// tell the current viewer someone is viewing same page
		io.to(room).emit('new viewer', username);

		// send the current viewers
		socket.emit('viewers', getMembers(room, username));

		socket.join(room);

	});

	socket.on('disconnect', function () {
		// emit leave
		io.to(socket.room).emit('leave', socket.username);
		// remove from sockets array
		var index = sockets.indexOf(socket);
		if(index >= 0) {
			sockets.splice(index, 1);
		}
	});

});

console.log('server running on port 8080');