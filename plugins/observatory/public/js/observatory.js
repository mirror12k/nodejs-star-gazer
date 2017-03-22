
function escape_html(s) {
	return s.replace(/[^0-9A-Za-z ]/g, function(c) {
		return "&#" + c.charCodeAt(0) + ";";
	});
}

function ObservatoryClient() {
	this.console_counter = 0;
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
	this.socket.on('console-output', this.on_console_output.bind(this));
};

ObservatoryClient.prototype.open_console = function (server_name) {
	var console_id = this.console_counter++;
	var console_dom = $('<div class="tab-pane" id="console-tab-' + console_id + '">'
		+ '<div class="console-output"></div>'
		+ '<input type="text" class="console-input"></input>'
		+ '</div>');

	console_dom.find('.console-input').keyup((function(e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if (code == 13) {
			var input = e.target.value;
			e.target.value = '';
			this.on_console_input(console_id, input);
		}
	}).bind(this));

	$('ul.nav.nav-tabs').append('<li><a role="tab" data-toggle="tab" href="#console-tab-' + console_id + '">' + escape_html(server_name) + '</a></li>');
	$('div.tab-content').append(console_dom);
	this.socket.emit('start-console', { server_name: server_name, console_id: console_id });
	$('a[href="#console-tab-' + console_id + '"]').tab('show');
};

ObservatoryClient.prototype.on_console_input = function(console_id, text) {
	this.socket.emit('console-input', { console_id: console_id, text: text });
};

ObservatoryClient.prototype.on_console_output = function(data) {
	console.log("debug console-output: ", data);
	var text = data.text;
	// text = escape_html(text);
	text = text.split("\n").join("<br>");
	var panel = $('#console-tab-' + data.console_id + ' .console-output');
	panel.append(text);
	panel.scrollTop(panel[0].scrollHeight);
};



$(function () {
	new ObservatoryClient();
});

