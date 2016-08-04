const chai = require('chai');
const expect = chai.expect;
chai.should();

const TEST_LOGS = !!process.env.TEST_VERBOSITY;

const SafeObject = require('../dist/SafeObject.js');
const Human = require('./things/Human.js');
const SuperHuman = require('./things/SuperHuman.js');
const Whale = require('./things/Whale.js');
const SuperWhale = require('./things/SuperWhale.js');

if (TEST_LOGS) console.log('Hello');

describe('SafeObject', function () {

  it('should have property _isSafeObject', function () {
    const human = new Human('George');
    const superHuman = new SuperHuman('Martha');
    human.should.have.property('_isSafeObject').and.be.equal(true);
    superHuman.should.have.property('_isSafeObject').and.be.equal(true);

    human.should.be.an.instanceOf(SafeObject);
    superHuman.should.be.an.instanceOf(SafeObject);
  });

  it('should list ancestors', function () {
    const human = new Human('George');
    const superHuman = new SuperHuman('Martha');

    SafeObject.getAncestors(human).should.be.eql([ SafeObject, Object ]);
    SafeObject.getAncestors(superHuman).should.be.eql([ Human, SafeObject, Object ]);
  });

  it('should list all instance properties for the class and all ancestors', function () {
    const human = new Human('George');
    const superHuman = new SuperHuman('Martha');

    SafeObject.getRegisteredPropertyNames(human).should.be.eql([ '_isSafeObject', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'isHuman' ]);
    SafeObject.getRegisteredPropertyNames(superHuman).should.be.eql([ '_isSafeObject', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'isHuman', 'superPowers', 'superPowersMap', 'isSafeObject', 'superName', 'musclesPerSquareCentimeter', 'superFriends' ]);
  });

  it('should give the ignored properties', function () {
    const superHuman = new SuperHuman('Martha');
    superHuman._getIgnoredSafeObjectPropertyNames().should.have.length(2);
    //  .and.should.eql([ 'ignoreMe' ]);
  });

  it('should give the correct unregistered properties', function () {
    const superHuman = new SuperHuman('Martha');
    SafeObject.getUnregisteredPropertyNames(superHuman).should.have.length(1);
  });

  it('should interpret factories and methods differently', function () {
    const superHuman = new SuperHuman('Martha');
    superHuman.should.have.property('isSafeObject').and.be.a.instanceOf(Function);
    superHuman.should.have.property('superPowers').and.be.a.instanceOf(Array);
  });

  it('should set all properties to null', function () {
    var ref1 = {};
    var ref2 = {};
    var ref3 = {};
    var ref4 = {};

    var superHuman = new SuperHuman('Martha');
    superHuman.leftArm = ref1;
    superHuman.rightArm = ref2;
    superHuman.leftLeg = ref3;
    superHuman.rightLeg = ref4;

    superHuman.destroy();
    superHuman.should.have.property('leftArm').and.be.equal(null);
    superHuman.should.have.property('rightArm').and.be.equal(null);
    superHuman.should.have.property('leftLeg').and.be.equal(null);
    superHuman.should.have.property('rightLeg').and.be.equal(null);
    superHuman.should.have.property('isHuman').and.be.equal(true); // cause is non-configurable
    superHuman.should.have.property('superPowers').and.be.equal(null);
    superHuman.should.have.property('superPowersMap').and.be.equal(null);
    superHuman.should.have.property('isSafeObject').and.be.equal(null);
    superHuman.should.have.property('superName').and.be.equal(null);
    superHuman.should.have.property('musclesPerSquareCentimeter').and.be.equal(null);
    superHuman.should.have.property('superFriends').and.be.equal(null);
  });

  it('should set superPowers properties to [] insteadof function () {}', function () {
    var superHuman = new SuperHuman('Martha');
    superHuman.should.have.property('superPowers').and.be.eql([]);
    superHuman.should.have.property('superPowersMap').and.be.eql({})
  });

  if (TEST_LOGS) {

    after(function () {
      console.log(SafeObject.debug(new SuperHuman('Martha')));
    });

  }

});

describe('SafeObject Inclusion', function () {

  it('should have property _isSafeObject', function () {
    const superWhale = new SuperWhale('Martha');
    superWhale.should.have.property('_isSafeObject').and.be.equal(true);
    superWhale.should.not.be.an.instanceOf(SafeObject);
  });

  it('should have properties well defined', function () {

    var superWhale = new SuperWhale('Martha');


    superWhale.should.have.property('name').and.be.equal('Martha');
    superWhale.should.have.property('createdAt').and.be.an.instanceOf(Object);
    superWhale.should.have.property('updatedAt').and.be.an.instanceOf(Date);
  });

  it('should list ancestors', function () {
    const superWhale = new SuperWhale('Martha');
    SafeObject.getAncestors(superWhale).should.be.eql([ Whale, Object ]);
  });

  it('should list all instance properties for the class and all ancestors', function () {
    const superWhale = new SuperWhale('Martha');
    SafeObject.getRegisteredPropertyNames(superWhale).should.be.eql([ 'name', 'createdAt', 'updatedAt', '_isSafeObject' ]);
  });

  it('should give the correct unregistered properties', function () {
    const superWhale = new SuperWhale('Martha');
    SafeObject.getUnregisteredPropertyNames(superWhale).should.have.length(1);
  });

  it('should set all properties to null', function () {

    var superWhale = new SuperWhale('Martha');

    SafeObject.prototype.destroy.call(superWhale);
    superWhale.should.have.property('name').and.be.equal(null);
    superWhale.should.have.property('createdAt').and.be.equal(null);
    superWhale.should.have.property('updatedAt').and.be.equal(null);
  });

  if (TEST_LOGS) {

    after(function () {
      console.log(SafeObject.debug(new SuperWhale('Martha')));
    });

  }

});

describe('SafeObject Constructor registration', function () {
  var Vector3;
  var defaultConstructors = [ Object, Array, Date, Map, Set ];
  before(function () {
    Vector3 = function Vector3(x, y, z) {
      this.x = x | 0;
      this.y = y | 0;
      this.z = z | 0;
    };
  });
  it('should have default constructors', function () {
    defaultConstructors.forEach(function (ctr) {
      SafeObject.getRegisteredConstructor(ctr).should.have.property('ConstructorFunction')
        .and.be.equal(ctr);
    });
  });
  it('should register/unregister constructor', function () {
    SafeObject.registerConstructor(Vector3);
    SafeObject.getRegisteredConstructor(Vector3)
      .should.have.property('ConstructorFunction')
        .and.be.equal(Vector3);
    SafeObject.unregisterConstructor(Vector3);
    expect(SafeObject.getRegisteredConstructor(Vector3)).to.be.a('undefined');

  });
});