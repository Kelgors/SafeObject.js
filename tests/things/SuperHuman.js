var Human = require('./Human.js');

function SuperHuman(name) {
  Human.call(this, name);
  this.ignoreMe = 2;
}

SuperHuman.prototype = Object.create(Human && Human.prototype, {
  constructor: {
    value: SuperHuman,
    enumerable: false, writable: true, configurable: true
  },
  _getIgnoredSafeObjectPropertyNames: {
    value: function _getIgnoredSafeObjectPropertyNames() { return [ 'ignoreMe' ]; },
    enumerable: false, writable: true, configurable: true
  }
});
SuperHuman.INSTANCE_PROPERTIES = [ 'superPowers' ];

module.exports = SuperHuman;