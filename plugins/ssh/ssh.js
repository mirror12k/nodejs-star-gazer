
var ssh2 = require('ssh2');


function SSHConnection(connection) {
	this.connection = connection;
	this.connection_closed = false;
	this.connection.on('close', this.on_close.bind(this));
}

SSHConnection.prototype.start_shell = function(callback) {
	var self = this;

	if (this.connection_closed)
		return callback(new Error("connection is already closed"));
	
	this.connection.shell(callback);
};

SSHConnection.prototype.end = function() {
	this.connection.end();
};

SSHConnection.prototype.exec_command = function(command, callback) {
	if (this.connection_closed)
		return callback(new Error("connection is already closed"));

	this.connection.exec(command, function(err, stream) {
		if (err)
			return callback(err);
		var output = '';
		stream.on('close', function(code, signal) {
			// // console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
			// conn.end();
			callback(undefined, output);
		}).on('data', function(data) {
			output += data;
		}).stderr.on('data', function(data) {
			console.log('STDERR: ' + data);
		});
	});
};

SSHConnection.prototype.on_close = function() {
	this.connection_closed = true;
};


function SSHCredentials(server_name, credentials) {
	this.server_type = 'ssh';
	this.server_name = server_name;
	this.credentials = credentials;
	this.default_status_command = 'uptime';
}

// hook to register the server type
SSHCredentials.initialize = function(gazer) {
	gazer.register_server_type('ssh', SSHCredentials);
};

// necessary callbacks to store/load credentials and create new ones
SSHCredentials.prototype.to_store = function () {
	return this.credentials;
};

SSHCredentials.from_store = function (server_name, credentials) {
	return new SSHCredentials(server_name, credentials);
};

SSHCredentials.create_new = function (server_name, credentials) {
	if (credentials.host === undefined) {
		console.error("error: missing host field in ssh credentials");
		return;
	}
	if (credentials.username === undefined) {
		console.error("error: missing username field in ssh credentials");
		return;
	}
	if (credentials.password === undefined) {
		console.error("error: missing password field in ssh credentials");
		return;
	}
	if (credentials.port === undefined) {
		console.log("warning: defaulting to using port 22");
		credentials.port = 22;
	}
	// todo: implement parsing key options

	return new SSHCredentials(server_name, credentials);
};

// runs when the 'list' command is called
SSHCredentials.prototype.print_info = function() {
	console.log("\t" + this.credentials.username + "@" + this.credentials.host + ":" + this.credentials.port);
};

// runs when the 'connect' command is called
SSHCredentials.prototype.open_connection = function (callback) {
	var conn = new ssh2.Client();
	conn.on('ready', function() {
		callback(undefined, new SSHConnection(conn));
	}).on('error', function (err) {
		callback(err);
	}).connect({
		host: this.credentials.host,
		port: this.credentials.port,
		username: this.credentials.username,
		password: this.credentials.password,
		// privateKey: require('fs').readFileSync('/here/is/my/key')
	});
};

SSHCredentials.prototype.set_fields = function(opts) {
	for (var opt_name in opts) {
		if (opt_name.startsWith('x-')) {
			if (opts[opt_name] === '') {
				delete this.credentials[opt_name];
			} else {
				this.credentials[opt_name] = opts[opt_name];
			}
		} else if (opt_name === 'host' || opt_name === 'username' || opt_name === 'password') {
			this.credentials[opt_name] = opts[opt_name];
		} else if (opt_name === 'port') {
			this.credentials[opt_name] = parseInt(opts[opt_name], 10);
		} else {
			console.error("invalid field for SSHCredentials: '" + opt_name + "'");
			return false;
		}
	}
	return true;
};



module.exports = SSHCredentials;
