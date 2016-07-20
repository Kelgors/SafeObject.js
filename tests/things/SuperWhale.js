var SafeObject = require('../../dist/SafeObject.js');
var Whale = require('./Whale.js');

function SuperWhale(name) {
  Whale.call(this, name);
  SafeObject.include(this);
}

SuperWhale.prototype = Object.create(Whale.prototype, {
  constructor: {
    value: SuperWhale,
    enumerable: false, writable: true, configurable: true
  }
});

SuperWhale.INSTANCE_PROPERTIES = { name: null };

module.exports = SuperWhale;