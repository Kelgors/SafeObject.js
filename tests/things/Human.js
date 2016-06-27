var SafeObject = require('../../dist/SafeObject.js');

function Human(name) {
  SafeObject.call(this);
  this.name = name;
}

Human.prototype = Object.create(SafeObject && SafeObject.prototype, {
  constructor: {
    value: Human,
    enumerable: false, writable: true, configurable: true
  }
});
Human.INSTANCE_PROPERTIES = [
  'leftArm',
  'rightArm',
  'leftLeg',
  'rightLeg'
];

module.exports = Human;