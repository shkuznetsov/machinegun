var EventEmitter = require('events');

module.exports = function (opt) {
	var machinegun = new EventEmitter(),
	    shooting = 0,
	    magazine = [],
		opt = opt || {};

	var opt = {
		barrels: typeof opt.barrels == 'undefined' ? 1 : opt.barrels,
		giveupOnError: typeof opt.giveupOnError == 'undefined' ? false : opt.giveupOnError,
		fireImmediately: typeof opt.fireImmediately == 'undefined' ? true : opt.fireImmediately,
		fireAsynchronously: typeof opt.fireAsynchronously == 'undefined' ? true : opt.fireAsynchronously,
	};

	// State machine: firing, fireCeased, givenUp
	var state = opt.fireImmediately ? 'firing' : 'fireCeased';

	// Primer function wrapper class
	// Used mainly to contextualise callback
	var Cartridge = function (powder, context) {
		var callback = function (err) {
			shooting--;
			if (err) {
				machinegun.emit('error', err, context);
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
			if (opt.fireAsynchronously) process.nextTick(primer);
			else primer();
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
			}
		}
	};

	// API methods

	machinegun.load = function (primer, context) {
		magazine.push(new Cartridge(primer, context));
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

	return machinegun;
};