// this is something we dont have access to (or we cant extend)
var SafeObject = require('../../dist/SafeObject.js');
function Whale(name) {
  SafeObject.include(this);
  this.name = name;
};
Whale.INSTANCE_PROPERTIES = {
  name: null,
  createdAt: Date,
  updatedAt: Date
};
module.exports = Whale;