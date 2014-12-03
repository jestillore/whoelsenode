(function () {

	var socket = io.connect('http://whoelse.eu-gb.mybluemix.net');
	var username = getUsername();
	var coViewers = [];
	var $viewers = $('#viewers');
	var $notifications = $('#notifications');

	socket.on('viewers', function (viewers) {
		coViewers = viewers;
		updateUserList();
	});

	socket.on('new viewer', function (viewer) {
		coViewers.push(viewer);
		updateUserList();
	});

	socket.on('leave', function (viewer) {
		coViewers.splice(coViewers.indexOf(viewer), 1);
		updateUserList();
	});

	socket.on('notification', function (notifications) {
		for(var x = 0; x < notifications.length; x++) {
			var notification = notifications[x];
			var $li = $('<li></li>');
			$li.text(notification.body);
			$notifications.append($li);
		}
	});

	socket.emit('register', {
		id: getID(),
		username: getUsername(),
		pathname: window.location.pathname
	});

	function updateUserList() {
		$viewers.empty();
		$.each(coViewers, function (index, viewer) {
			var $li = $('<li></li>');
			$li.text(viewer);
			$viewers.append($li);
		});
	}

	function getUsername() {
		var username = localStorage.getItem('username');
		if(!username) {
			username = 'user' + getID();
			localStorage.setItem('username', username);
		}
		return username;
	}

	function getID() {
		var id = localStorage.getItem('id');
		if(!id) {
			id = Math.floor(Math.random() * 50);
			localStorage.setItem('id', id);
		}
		return id;
	}

})();
