var Human = require('./Human.js');
var SafeObject = require('../../dist/SafeObject.js');

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
    value: function _getIgnoredSafeObjectPropertyNames() { return SafeObject.prototype._getIgnoredSafeObjectPropertyNames.call(this).concat([ 'ignoreMe' ]); },
    enumerable: false, writable: true, configurable: true
  }
});
SuperHuman.INSTANCE_PROPERTIES = [
  [ 'superPowers', function () { return []; } ],
  [ 'superPowersMap', function () { return {}; } ],
  [ 'isSafeObject', new SafeObject.PropertyDescriptor(function () { return this._isSafeObject; }, false, true, true, false) ],
  [ 'superName', '' ],
  [ 'musclesPerSquareCentimeter', 1e2 ],
  [ 'superFriends', new SafeObject.PropertyDescriptor(function () { return []; }, true, false, false) ]
];

module.exports = SuperHuman;