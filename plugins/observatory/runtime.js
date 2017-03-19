

function ObservatoryRuntime(gazer, sockio_server) {
	this.gazer = gazer;
	this.sockio_server = sockio_server;
	sockio_server.sockets.on('connection', this.onConnection.bind(this));
	this.queryServerState();
	setInterval(this.queryServerState.bind(this), 1000);
}

ObservatoryRuntime.prototype.	onConnection = function (socket) {
	socket.emit('star-gazer-config', this.gazer.serialize_config());
};

ObservatoryRuntime.prototype.queryServerState = function () {
	this.serverState = this.updatingServerState || {};
	this.sockio_server.emit('server-state', this.serverState);

	var newServerState = {};
	this.updatingServerState = newServerState;
	for (var server_name in this.gazer.config.credentials) {
		newServerState[server_name] = undefined;
		this.gazer.config.credentials[server_name].get_uptime((function (server_name, data) {
				console.log("" + server_name + ": " + data);
				newServerState[server_name] = data;
			}).bind(undefined, server_name));
	}
};


module.exports = ObservatoryRuntime;
