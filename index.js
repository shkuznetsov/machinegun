var EventEmitter = require('events');

module.exports = function (opt) {
	var machinegun = new EventEmitter(),
	    shooting = 0,
	    magazine = [],
		opt = opt || {};

	var opt = {
		barrels: typeof opt.barrels == 'undefined' ? 1 : opt.barrels,
		giveupOnError: typeof opt.giveupOnError == 'undefined' ? false : opt.giveupOnError,
		ceaseOnEmpty: typeof opt.ceaseOnEmpty == 'undefined' ? false : opt.ceaseOnEmpty,
		fireImmediately: typeof opt.fireImmediately == 'undefined' ? true : opt.fireImmediately
	};

	// State machine: firing, fireCeased, givenUp
	var state = opt.fireImmediately ? 'firing' : 'fireCeased';

	// Primer function wrapper class
	// Used mainly to contextualise callback
	var Cartridge = function (powder) {
		var callback = function (err) {
			shooting--;
			if (err) {
				// Only emit error if a listener exists
				// This is mainly to prevent silent errors in promises
				if (machinegun.listenerCount('error')) machinegun.emit('error', err);
				if (opt.giveupOnError) machinegun.giveUp();
			}
			trigger();
		};
		var primer = function () {
			var bang = powder(callback);
			if (bang && (typeof bang.then == 'function')) {
				bang.then(callback.bind(null, null), function (err) { callback(err || new Error()); });
			}
		};
		this.shoot = function () {
			shooting++;
			process.nextTick(primer);
		};
	};

	var trigger = function () {
		if (state == 'firing' && (!opt.barrels || opt.barrels > shooting)) {
			if (magazine.length) {
				// Below two lines easily justify weird naming convention around this module :)
				magazine.shift().shoot();
				trigger();
			}
			else if (!shooting) {
				machinegun.emit('empty');
				if (opt.ceaseOnEmpty) machinegun.ceaseFire();
			}
		}
	};

	// API methods

	machinegun.load = function (primer) {
		magazine.push(new Cartridge(primer));
		trigger();
		return machinegun;
	};

	machinegun.fire = function () {
		if (state == 'fireCeased') {
			machinegun.emit('fire');
			state = 'firing';
			trigger();
		}
		return machinegun;
	};

	machinegun.ceaseFire = function () {
		if (state == 'firing') {
			machinegun.emit('ceaseFire');
			state = 'fireCeased';
		}
		return machinegun;
	};

	machinegun.giveUp = function () {
		if (state != 'givenUp') {
			machinegun.emit('giveUp');
			state = 'givenUp';
		}
	};

	machinegun.promise = function () {
		return new Promise(function (resolve, reject) {
			machinegun.on('empty', resolve);
			machinegun.on('giveUp', reject);
		});
	}

	return machinegun;
};