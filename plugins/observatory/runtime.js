

function ObservatoryRuntime(gazer, sockio_server) {
	this.gazer = gazer;
	this.sockio_server = sockio_server;
	this.server_connections = {};
	sockio_server.sockets.on('connection', this.on_connection.bind(this));
	this.query_server_state();
	setInterval(this.query_server_state.bind(this), 1000);
}

ObservatoryRuntime.prototype.	on_connection = function (socket) {
	socket.active_consoles = {};
	socket.emit('star-gazer-config', this.gazer.serialize_config());
	socket.on('start-console', this.start_console.bind(this, socket));
	socket.on('console-input', this.on_console_input.bind(this, socket));
};

ObservatoryRuntime.prototype.query_server_state = function () {
	var self = this;

	this.serverState = this.updating_server_state || {};
	this.sockio_server.emit('server-state', this.serverState);

	var new_server_state = {};
	this.updating_server_state = new_server_state;
	for (var server_name in this.gazer.config.credentials) {
		new_server_state[server_name] = undefined;

		var status_command = this.gazer.config.credentials[server_name].default_status_command;
		if (this.server_connections[server_name]) {
			this.server_connections[server_name].exec_command(status_command, (function (server_name, err, data) {
				if (err) {
					self.server_connections[server_name] = undefined;
					console.error("connection error: " + err);
				} else {
					// console.log("" + server_name + ": " + data);
					new_server_state[server_name] = data;
				}
			}).bind(undefined, server_name));
		} else {
			this.gazer.config.credentials[server_name].open_connection((function (server_name, err, conn) {
				if (conn) {
					self.server_connections[server_name] = conn;
					conn.exec_command(status_command, function (err, data) {
						if (err) {
							self.server_connections[server_name] = undefined;
							console.error("connection error: " + err);
						} else {
							// console.log("" + server_name + ": " + data);
							new_server_state[server_name] = data;
						}
					});
				} else {
					// console.error('got error: ' + err);
				}
			}).bind(undefined, server_name));
		}

	}
};

ObservatoryRuntime.prototype.start_console = function(socket, console_data) {
	console.log("request for a console to server", console_data.server_name);
	this.gazer.config.credentials[console_data.server_name].open_connection(function (err, conn) {
		conn.start_shell(function (err, shell) {
			shell.on('data', function (data) {
				console.log('got output for console id', console_data.console_id, data);
				socket.emit('console-output', { console_id: console_data.console_id, text: data.toString() });
			});
			socket.active_consoles[console_data.console_id] = shell;
		});
	});
};

ObservatoryRuntime.prototype.on_console_input = function(socket, data) {
	if (socket.active_consoles[data.console_id]) {
		console.log("got input for console id", data.console_id, ":", data.text);
		socket.active_consoles[data.console_id].write(data.text + "\n");
	} else {
		console.log("got input for invalid console id", data.console_id);
	}
};


module.exports = ObservatoryRuntime;
