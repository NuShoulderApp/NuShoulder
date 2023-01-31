import moment from 'moment';

//  Create a debug creator object.
const debugCreator = require('debug');

//This function overrides the native formatArgs function of debug allowing us to format the date properly.
debugCreator.formatArgs = function formatArgs(args) {
	//Remove the IWD: from the namespace if it is there.
	const name = this.namespace.replace(/IWD:/,"").toUpperCase();

	//Add the date formatting and a tab after the app.
	args[0] = moment().format('MM-DD-YYYY HH:mm:ss') + " " + name + "\t" + args[0];
}

//  List of log types.
const logList = "DEBUG,ERROR,LOG".split(",");

//  Explicitly enable the IWD log and error types, and include what is in the DEBUG environment var.
debugCreator.enable('IWD:log,IWD:error,' + process.env.DEBUG);

// Keep a base list of loggers to bind with application specific information.
const loggers = buildBaseLoggers();

// Keep a cache of loggers that have been bound to a specific application.
const  boundLoggersCache = {};

export function getLoggers(application) {
	// See if we've bound this app yet, if not cache it.
	if(boundLoggersCache.hasOwnProperty(application) === false) {
		const boundLoggers = {};

		// Loop over the loggers object and bind the application to it.
		Object.keys(loggers).forEach(logger => boundLoggers[logger] = bindLogger(logger, application));

		return boundLoggersCache[application] = boundLoggers;
	}

	// Return the entry from the cache.
	return boundLoggersCache[application];
}

// bindLogger is a function that
function bindLogger(logger, application) {
	return loggers[logger].bind(null, application);
}

// Build the bas loggers which are debug instances.
function buildBaseLoggers() {
	const loggers = {};
	// Loop over the list and populate the new loggers object.
	logList.forEach(log => loggers[log.toLowerCase()] = debugCreator('IWD:' + log.toLowerCase()));

	return loggers;
}
