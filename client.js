(function () {

	var socket = io.connect('http://192.168.254.53:8080');
	var username = getUsername();
	var coViewers = [];
	var $viewers = $('#viewers');

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

	socket.emit('register', {
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
			username = 'user' + Math.floor(Math.random() * 50);
			localStorage.setItem('username', username);
		}
		return username;
	}

})();
