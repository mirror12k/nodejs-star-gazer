
var server = require('./server');

var observatory = {
	initialize: function (gazer) {
		gazer.register_command('observatory', [], observatory.command_observatory.bind(undefined, gazer));
	},
	command_observatory: function (gazer) {
		var app = server.spawn_app();
		var observatory_server = server.start_server(app);
		var socketio_server = server.start_socketio_server(observatory_server);
	},
};

module.exports = observatory;
