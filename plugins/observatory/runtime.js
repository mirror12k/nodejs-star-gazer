

function ObservatoryRuntime(gazer, sockio_server) {
	this.gazer = gazer;
	this.sockio_server = sockio_server;
	this.server_connections = {};
	sockio_server.sockets.on('connection', this.onConnection.bind(this));
	this.queryServerState();
	setInterval(this.queryServerState.bind(this), 1000);
}

ObservatoryRuntime.prototype.	onConnection = function (socket) {
	socket.emit('star-gazer-config', this.gazer.serialize_config());
};

ObservatoryRuntime.prototype.queryServerState = function () {
	var self = this;

	this.serverState = this.updatingServerState || {};
	this.sockio_server.emit('server-state', this.serverState);

	var newServerState = {};
	this.updatingServerState = newServerState;
	for (var server_name in this.gazer.config.credentials) {
		newServerState[server_name] = undefined;

		var status_command = this.gazer.config.credentials[server_name].default_status_command;
		if (this.server_connections[server_name]) {
			this.server_connections[server_name].exec_command(status_command, (function (server_name, err, data) {
				if (err) {
					self.server_connections[server_name] = undefined;
					console.error("connection error: " + err);
				} else {
					// console.log("" + server_name + ": " + data);
					newServerState[server_name] = data;
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
							newServerState[server_name] = data;
						}
					});
				} else {
					// console.error('got error: ' + err);
				}
			}).bind(undefined, server_name));
		}

	}
};


module.exports = ObservatoryRuntime;
