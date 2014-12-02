
var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(8080);

var paths = [
	// with ids
	'/orders/new/orderid/{id}',
	'/invoices/new/invoiceid/{id}',
	'/po/new/poid/{id}',
	'/orders/index/storeid/{id}',
	'/factorypacking/newpacking/psid/{id}',
	'/receive/packing/psid/{id}',

	// without id
	'/',
	'/po',
	'/po/orderrequest',
	'/orders',
	'/invoices',
	'/invoices/index/view/dropship',
	'/invoices/index/view/notshipped',
	'/invoices/index/view/',
	'/invoices/index/view/intl',
	'/invoices/index/view/intlnotdp',
	'/invoices/index/view/canada',
	'/invoices/index/view/future',
	'/invoices/index/view/futurenotdp',
	'/payment',
	'/packing/packinglist',
	'/packing',
	'/packing/po'
];

function handler() {
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
		path = path.substr(0, path.length - 1);
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

io.on('connection', function (socket) {

	// new viewer arrives
	socket.on('register', function (data) {
		var username = data.username;
		var room = getRoom(data.pathname);
		console.log(username + ' is in room ' + room);

		socket.username = username;
		socket.room = room;

		// tell the current viewer someone is viewing same page
		io.to(room).emit('new viewer', username);

		// send the current viewers
		socket.emit('viewers', getMembers(room, username));

		socket.join(room);

	});

	socket.on('disconnect', function () {
		// emit leave
		io.to(socket.room).emit('leave', socket.username);
	});

});
