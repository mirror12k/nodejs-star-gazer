
function escape_html(s) {
	return s.replace(/[^0-9A-Za-z ]/g, function(c) {
		return "&#" + c.charCodeAt(0) + ";";
	});
}

function ObservatoryClient() {
	this.start_client_connection();
}

ObservatoryClient.prototype.on_config = function(config) {
	// console.log('got config');
	this.config = config;
};
ObservatoryClient.prototype.on_server_state = function(state) {
	// console.log('got server state');
	this.server_state = state;
	this.reload_server_list();
};

ObservatoryClient.prototype.reload_server_list = function() {
	$('#server-list').empty();
	if (this.config) {
		for (var server_name in this.config.credentials) {
			if (this.server_state[server_name]) {
				var entry = $('<div class="server-entry server-up">'
					+ '<span class="glyphicon glyphicon-list-alt console-button"></span>'
					+ '<span class="server-name">' + escape_html(server_name) + '</span> : '
					+ this.server_state[server_name] + '</div>');
				entry.find('.console-button').click(this.open_console.bind(this, server_name));
				$('#server-list').append(entry);
			} else {
				var entry = $('<div class="server-entry server-down">'
					+ '<span class="server-name">' + escape_html(server_name) + '</span> : '
					+ '---' + '</div>');
				$('#server-list').append(entry);
			}
		}
	}
};

ObservatoryClient.prototype.start_client_connection = function () {
	this.socket = io.connect('/');
	this.socket.on('star-gazer-config', this.on_config.bind(this));
	this.socket.on('server-state', this.on_server_state.bind(this));
}

ObservatoryClient.prototype.open_console = function (server_name) {
	this.socket.emit('start_console', server_name);
}


$(function () {
	new ObservatoryClient();
});

