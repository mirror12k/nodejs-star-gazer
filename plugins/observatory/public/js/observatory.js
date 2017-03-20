
function escape_html(s) {
	return s.replace(/[^0-9A-Za-z ]/g, function(c) {
		return "&#" + c.charCodeAt(0) + ";";
	});
}

function ObservatoryClient() {
	this.startClientConnection();
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
				$('#server-list').append(
					'<div class="server-entry server-up"><p>'
					+ '<span class="server-name">' + escape_html(server_name) + '</span> : '
					+ this.server_state[server_name] + '</p></div>');
			} else {
				$('#server-list').append(
					'<div class="server-entry server-down"><p>'
					+ '<span class="server-name">' + escape_html(server_name) + '</span> : '
					+ '---' + '</p></div>');
			}
		}
	}
};

ObservatoryClient.prototype.startClientConnection = function () {
	this.socket = io.connect('/');
	this.socket.on('star-gazer-config', this.on_config.bind(this));
	this.socket.on('server-state', this.on_server_state.bind(this));
}


$(function () {
	new ObservatoryClient();
});
