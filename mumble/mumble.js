/*!*
 * mumble.js v1.0.1
 * https://github.com/swemaniac/mumble
 *
 * A simple framework for adding voice commands to a web site using the web speech recognition API.
 * Supports the CommonJs/node.js/AMD and global syntax.
 *
 * See https://github.com/swemaniac/mumble for a readme and some examples.
 * Forked from and inspired by https://github.com/TalAter/annyang.
 */

/**
 * Definition of a speech callback.
 *
 * @callback SpeechCallback
 * @param {event} event The original event object.
 */

/**
 * Definition of a command object.
 *
 * @typedef {object} Command
 *
 * @property {string} name The command identifier.
 * @property {string|RegExp} command The command in regex form (can be string or object).
 * @property {function} action A callback that will be run when the command matches speech with the matched parameters.
 */

/**
 * Definition of an options object.
 *
 * @typedef {object} Options
 *
 * @property {string} [language=en-US] A 4-letter language code, e.g. en-US.
 * @property {boolean} [autoRestart=true] Whether to allow auto restarting the speech recognizer.
 * @property {boolean} [continuous] Whether the speech recognizer should act as a dictation device.
 * @property {integer} [maxAlternatives=5] The max number of alternative transcripts from the speech recognizer (defaults to 5).
 * @property {boolean} [debug=false] Whether to enable debug logging.
 * @property {Command[]} [commands] An array of commands, can also be added with addCommand().
 * @property {SpeechCallback[]} [callbacks] An object describing various callbacks to events (start, end, speech, recognizeMatch, recognizeNoMatch, error).
 */

(function(name, definition) {
	if (typeof module != 'undefined') module.exports = definition();
	else if (typeof define == 'function' && typeof define.amd == 'object') define(definition);
	else this[name] = definition();
}('Mumble',
	/**
	 * Module mumble.
	 * @module mumble
	 */
	function() {
		"use strict";

		/**
		 * Module entrypoint/constructor.
		 *
		 * @constructor
		 * @alias module:mumble
		 *
		 * @param {Options} options An options object.
		 */
		var Mumble = function(options) {
			var _recognizer = null;
			var _startTime = 0;
			var _aborted = false;
			var _commands = [];

			var _options = {
				language: 'en-US',
				autoRestart: true,
				continuous: window.location.protocol === 'http:',
				maxAlternatives: 5,
				debug: false,

				commands: [

				],

				callbacks: {
					start: null,
					end: null,
					speech: null,
					recognizeMatch: null,
					recognizeNoMatch: null,
					error: null
				}
			};

			var _self = this;

			/**
			 * Call to start listening for speech.
			 * @throws If the SpeechRecognition object wasn't supported.
			 */
			this.start = function() {
				if (!this.isAvailable()) {
					throw 'Speech recognition not supported in this browser';
				}

				_aborted = false;
				_startTime = new Date().getTime();

				_log('Starting with %d command(s) active', _commands.length);

				_recognizer.start();
			};

			/**
			 * Call to stop listening for speech.
			 */
			this.stop = function() {
				if (this.isAvailable()) {
					_aborted = true;
					_recognizer.abort();
				}
			};

			/**
			 * Check if the SpeechRecognition object is supported.
			 * @return {boolean}
			 */
			this.isAvailable = function() {
				return !!_recognizer;
			};

			/**
			 * Gets a reference to the SpeechRecognition object.
			 * @return {SpeechRecognition}
			 */
			this.getSpeechRecognitionObject = function() {
				return _recognizer;
			};

			/**
			 * Adds a command.
			 *
			 * The command syntax can be a string with or without any regex instructions,
			 * or a RegExp object. Either way it will be converted to a RegExp object with
			 * the ignoreCase flag set.
			 *
			 * **Example**
			 *
			 * `addCommand('appointment', /^book (.+) for me (today|tomorrow) at (\d+)$/, function(appointment, date, hour) { })`
			 *
			 * @param {string} name A command identifier.
			 * @param {string|RegExp} command The command in regex form (can be string or object).
			 * @param {function} action A callback that will be run when the command matches speech.
			 *
			 * @throws If a command with the same name already exists.
			 */
			this.addCommand = function(name, command, action) {
				if (this.getCommand(name)) {
					throw 'Command "' + name + '"" already exists';
				}

				// wrap the command in a RegExp object with the ignoreCase flag
				var commandSrc = typeof(command) == 'string' ? ('^' + command + '$') : command.source;
				var commandExp = new RegExp(commandSrc, 'i');

				_commands.push({
					name: name,
					command: commandExp,
					action: action
				});

				_log('Added command: "%s", %s', name, commandExp);
			};

			/**
			 * Removes a command.
			 * @param {string} name The command identifier.
			 */
			this.removeCommand = function(name) {
				var foundIndex = -1;

				_commands.some(function(command, index) {
					if (command.name == name) {
						foundIndex = index;
						return true;
					}

					return false;
				});

				if (foundIndex >= 0) {
					delete _commands[foundIndex];
					_log('Removed command "%s"', name);
				}
			};

			/**
			 * Gets a previously added command.
			 *
			 * @param {string} name A command identifier.
			 * @return {Command} A command.
			 */
			this.getCommand = function(name) {
				var found = null;

				_commands.some(function(command) {
					if (command.name == name) {
						found = command;
						return true;
					}

					return false;
				});

				return found;
			};

			/**
			 * Sets the language of the speech recognizer.
			 * @param {string} language A 4 letter language code (e.g. en-US).
			 */
			this.setLanguage = function(language) {
				_options.language = language;

				if (this.isAvailable()) {
					_recognizer.lang = _options.language;
				}
			};

			/**
			 * Sets whether the speech recognizer should be auto restarted
			 * after an "end" event.
			 *
			 * @param {boolean} autoRestart
			 */
			this.setAutoRestart = function(autoRestart) {
				_options.autoRestart = !!autoRestart;
			};

			/**
			 * Sets the max number of alternative transcripts that the
			 * speech recognizer should return.
			 *
			 * Mumble will try to match a command to each of these transcripts.
			 *
			 * @param {integer} maxAlternatives
			 */
			this.setMaxAlternatives = function(maxAlternatives) {
				_options.maxAlternatives = parseInt(maxAlternatives);

				if (this.isAvailable()) {
					_recognizer.maxAlternatives = _options.maxAlternatives;
				}
			};

			/**
			 * Sets whether the speech recognizer should act as a dictation device or
			 * a one-shot command device.
			 *
			 * In HTTPS, turn off continuous mode for faster results.
			 * In HTTP, turn on continuous mode for much slower results, but no repeating security notices.
			 *
			 * @param {boolean} continuous The mode of the speech recognizer.
			 */
			this.setContinuous = function(continuous) {
				_options.continuous = !!continuous;

				if (this.isAvailable()) {
					_recognizer.continuous = _options.continuous;
				}
			};

			/**
			 * Enables or disabled debug logging to the console.
			 * @param {boolean} debug
			 */
			this.setDebug = function(debug) {
				_options.debug = !!debug;
			};

			function _init(options) {
				_recognizer = _getRecognizerObject();

				if (!_self.isAvailable()) {
					return;
				}

				// merge default options with user options
				if (options) {
					for (var opt in _options) {
						if (options[opt]) {
							_options[opt] = options[opt];
						}
					}
				}

				_self.setLanguage(_options.language);
				_self.setContinuous(_options.continuous);
				_self.setAutoRestart(_options.autoRestart);
				_self.setMaxAlternatives(_options.maxAlternatives);
				_self.setDebug(_options.debug);

				// add commands
				_options.commands.forEach(function(command) {
					_self.addCommand(command.name, command.command, command.action);
				});

				// set callbacks
				_recognizer.onstart = _onStart;
				_recognizer.onend = _onEnd;
				_recognizer.onerror = _onError;
				_recognizer.onresult = _onResult;
			}

			function _onStart(event) {
				_log('Start listening..', event, _options);
				_callback(_options.callbacks.start, event, _self);
			}

			function _onEnd(event) {
				_log('Stop listening..', event);
				_callback(_options.callbacks.end, event, _self);

				if (_options.autoRestart && !_aborted) {
					_log('(Auto-restarting)');

					var timeSinceLastStarted = new Date().getTime() - _startTime;

					// allow at least 1s between restarts
					if (timeSinceLastStarted < 1000) {
						setTimeout(_self.start, 1000 - timeSinceLastStarted);
					} else {
						_self.start();
					}
				}
			}

			function _onError(event) {
				_log('Error occurred', event);
				_callback(_options.callbacks.error, event, _self);

				if (['not-allowed', 'service-not-allowed'].indexOf(event.error) !== -1) {
					_self.setAutoRestart(false);
				}
			}

			function _onResult(event) {
				_log('Got result', event);
				_callback(_options.callbacks.speech, event, _self);

				var results = event.results[event.resultIndex];
				var matchFound = false;

				// loop through the transcription results
				for (var i = 0; i < results.length; i++) {
					var result = results[i];
					var transcript = result.transcript.trim();

					_log('Recognized: "%s"', transcript);

					// check each command against the transcript, halting on the first match
					matchFound = _commands.some(function(command) {
						var match = command.command.exec(transcript);

						// we got a match
						if (match) {
							var parameters = match.slice(1);

							_log('Command matched: "%s", %s', command.name, command.command, parameters);

							// call the generic callback and the command action with any possible parameters from the regex
							_callback(_options.callbacks.recognizeMatch, event, _self);
							command.action.apply(_self, parameters);

							return true;
						}

						return false;
					});

					// don't go through the rest of the commands on a match
					if (matchFound) {
						break;
					}
				}

				if (!matchFound) {
					_callback(_options.callbacks.recognizeNoMatch, event, _self);
				}

				return matchFound;
			}

			function _callback(callback, event, context) {
				if (typeof(callback) == 'function') {
					callback.call(context, event);
				}
			}

			function _getRecognizerObject() {
				var SpeechRecognizer = window.SpeechRecognition ||
									window.webkitSpeechRecognition ||
									window.mozSpeechRecognition ||
									window.msSpeechRecognition ||
									window.oSpeechRecognition;

				if (SpeechRecognizer) {
					return new SpeechRecognizer();
				}

				_log('SpeechRecognition object not supported');

				return null;
			}

			function _log() {
				if (!!_options.debug) {
					var out = window.console || { log: function() { } };
					out.log.apply(out, arguments);
				}
			}

			_init(options);
		};

		return Mumble;
	}
));