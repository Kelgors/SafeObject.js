require('chai').should();
const SafeObject = require('../dist/SafeObject.commonjs.js').default;

console.log('Hello');

describe('SafeObject', function () {

  var View = (function (_super) {
    function View() {
      _super.constructor.call(this);
    }
    View.prototype = Object.create(_super, {
      constructor: { value: View }
    });
    View.INSTANCE_PROPERTIES = [ 'data', 'childViews' ];
    return View;
  })(SafeObject.prototype);

  var FatView = (function (_super) {
    function FatView() {
      _super.constructor.call(this);
    }
    FatView.prototype = Object.create(_super, {
      constructor: { value: FatView }
    });
    FatView.INSTANCE_PROPERTIES = [ 'fatViewAttribute' ];
    return FatView;
  })(View.prototype);

  it('should have properties into the instance', function () {

    var view = new View();
    view.should.have.property('data').which.is.equal(null);
    view.should.have.property('childViews').which.is.equal(null);

    view.data = [];
    view.childViews = [];

    view.destroy();
    view.should.have.property('data').which.is.equal(null);
    view.should.have.property('childViews').which.is.equal(null);

  });

  it('should have properties of all ancestors', function () {

    var fatview = new FatView();
    fatview.should.have.property('fatViewAttribute').which.is.equal(null);
    fatview.should.have.property('data').which.is.equal(null);
    fatview.should.have.property('childViews').which.is.equal(null);

    var destroyCalled = false;
    fatview.childViews = new SafeObject();
    fatview.childViews.destroy = function () {
      destroyCalled = true;
      View.prototype.destroy.call(this);
    };

    fatview.destroy();

    destroyCalled.should.be.equal(true);

  });

  it('should do the same thing with include method', function () {

    function MyNewType() {
      SafeObject.include(this);
      this.type2 = 2;
    }
    MyNewType.INSTANCE_PROPERTIES = [ 'type1', 'type2' ];

    var myNewType = new MyNewType();

    myNewType.should.have.property('type1').which.is.equal(null);
    myNewType.should.have.property('type2').which.is.equal(2);
    myNewType.should.have.property('destroy');

    myNewType.destroy();

    myNewType.should.have.property('type1').which.is.equal(null);
    myNewType.should.have.property('type2').which.is.equal(null);

    myNewType.type3 = 3;
    myNewType.type4 = 3;

    console.log(SafeObject.debug(myNewType));


  });

});