'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (root, exportName) {
  //function warn(message) {}
  var warn = console.warn.bind(console);

  var PropertyDescriptor = function () {
    function PropertyDescriptor(value, enumerable, writable, configurable) {
      _classCallCheck(this, PropertyDescriptor);

      this.value = value;
      this.enumerable = typeof enumerable === 'undefined' ? true : false;
      this.writable = typeof writable === 'undefined' ? true : false;
      this.configurable = typeof configurable === 'undefined' ? true : false;
    }

    _createClass(PropertyDescriptor, [{
      key: 'clone',
      value: function clone() {
        return new PropertyDescriptor(this.value, this.enumerable, this.writable, this.configurable);
      }
    }]);

    return PropertyDescriptor;
  }();

  var SafeObject = function () {
    _createClass(SafeObject, null, [{
      key: 'debug',
      value: function debug(instance) {
        var buffer = [];
        buffer.push('----- SafeObject debug -----');
        buffer.push('Constructor: ' + String(instance.constructor.name));
        buffer.push('_isSafeObject: ' + String(!!instance._isSafeObject));
        if (instance._isSafeObject) {
          (function () {
            var ancestors = SafeObject.getAncestors(instance);
            buffer.push('Ancestors: ' + ancestors.map(function (d) {
              return d.name;
            }).join(' < '));
            var attributeNames = SafeObject.getRegisteredPropertyNames(instance);
            var registeredAttributeNames = instance._getIgnoredSafeObjectPropertyNames().concat(attributeNames);
            var unregisteredAttributeNames = Object.getOwnPropertyNames(instance).filter(function (d) {
              return registeredAttributeNames.indexOf(d) === -1;
            });
            buffer.push('ignored properties: ' + instance._getIgnoredSafeObjectPropertyNames().join(', '));
            buffer.push('registered properties: ' + attributeNames.join(', '));
            buffer.push('unregistered properties: ' + unregisteredAttributeNames.join(', '));
          })();
        }
        return buffer.join('\n');
      }
    }, {
      key: 'include',
      value: function include(instance) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        if (SafeObject.isSafeObject(instance)) return instance;
        if (!Array.isArray(instance.constructor.INSTANCE_PROPERTIES)) {
          instance.constructor.INSTANCE_PROPERTIES = [];
        }
        var instanceProperties = instance.constructor.INSTANCE_PROPERTIES;

        if (instanceProperties.findIndex(function (d) {
          return d === '_isSafeObject' || Array.isArray(d) && d[0] === '_isSafeObject';
        }) === -1) {
          instanceProperties.push.apply(instanceProperties, SafeObject.INSTANCE_PROPERTIES);
        }

        [{ methodName: 'destroy', returnsMerge: 'super' }, { methodName: '_getIgnoredSafeObjectPropertyNames', returnsMerge: 'concat' }].forEach(function (_ref) {
          var methodName = _ref.methodName;
          var returnsMerge = _ref.returnsMerge;

          if (!options.force && methodName in instance) {
            warn('Overriding ' + methodName + ' method');
          }
          // check if property exists and is a method
          var hasProperty = methodName in instance;
          var isFunction = typeof instance[methodName] === 'function';
          var _superMethod = instance[methodName];
          // define the method only if it hasnt the property or 'force' is true
          if (hasProperty && options.force || !hasProperty) {
            if (instanceProperties.findIndex(function (d) {
              return d === methodName || Array.isArray(d) && d[0] === methodName;
            }) === -1) {
              instanceProperties.push([methodName, new PropertyDescriptor(isFunction ? overrideMethod : SafeObject.prototype[methodName], false, true, true)]);
            }
          }

          function overrideMethod() {
            var superOut = _superMethod.apply(this, arguments);
            var safeObjectOut = SafeObject.prototype[methodName].call(this);
            var out = void 0;
            switch (returnsMerge) {
              case 'super':
                out = superOut;break;
              case 'concat':
                out = (superOut || []).concat(safeObjectOut || []);break;
            }
            return out;
          }
        });

        SafeObject.setProperties(instance, SafeObject.SAFE_OBJECT_INITIALIZE, instanceProperties.concat(SafeObject.INSTANCE_PROPERTIES));

        return instance;
      }
    }, {
      key: 'isSafeObject',
      value: function isSafeObject(object) {
        return object && object._isSafeObject === true;
      }
    }, {
      key: 'getAncestors',
      value: function getAncestors(object) {
        var current = object.constructor;
        var out = [];
        while (current = Object.getPrototypeOf(current.prototype) ? Object.getPrototypeOf(current.prototype).constructor : null) {
          out.push(current || []);
        }
        return out;
      }
    }, {
      key: 'getRegisteredProperties',
      value: function getRegisteredProperties(safeObject) {
        var ancestors = [safeObject.constructor].concat(SafeObject.getAncestors(safeObject));
        var out = [];
        for (var index = 0; index < ancestors.length; index++) {
          out.push.apply(out, ancestors[index].INSTANCE_PROPERTIES);
        }
        return out;
      }
    }, {
      key: 'getUnregisteredPropertyNames',
      value: function getUnregisteredPropertyNames(safeObject) {
        var registeredAttributeNames = SafeObject.getRegisteredPropertyNames(safeObject);
        registeredAttributeNames.push.apply(registeredAttributeNames, safeObject._getIgnoredSafeObjectPropertyNames());
        return Object.getOwnPropertyNames(safeObject).filter(function (propertyName) {
          return registeredAttributeNames.indexOf(propertyName) === -1;
        });
      }
    }, {
      key: 'getRegisteredPropertyNames',
      value: function getRegisteredPropertyNames(safeObject) {
        return SafeObject.getRegisteredProperties(safeObject).map(function (d) {
          return Array.isArray(d) ? d[0] : d;
        });
      }
    }, {
      key: 'setInstanceProperties',
      value: function setInstanceProperties(safeObject, state) {
        SafeObject.setProperties(safeObject, state, SafeObject.getRegisteredProperties(safeObject));
      }
    }, {
      key: 'setProperties',
      value: function setProperties(object, state, propertyDescriptors) {
        for (var index = 0; index < propertyDescriptors.length; index++) {
          try {
            var attributeDescriptor = propertyDescriptors[index];
            var fieldName = void 0;
            var descriptor = void 0;
            if (typeof attributeDescriptor === 'string') {
              fieldName = attributeDescriptor;
              descriptor = SafeObject.parsePropertyDescriptor(null);
            } else if (Array.isArray(attributeDescriptor)) {
              fieldName = attributeDescriptor[0];
              descriptor = SafeObject.parsePropertyDescriptor(attributeDescriptor[1]);
            }
            SafeObject.setProperty(object, fieldName, descriptor, state);
          } catch (err) {
            warn('SafeObject#setProperties: ' + err.toString());
          }
        }
      }
    }, {
      key: 'setProperty',
      value: function setProperty(object, fieldName, propertyDescriptor, state) {
        if (!propertyDescriptor) {
          warn('Property descriptor isnt well formed for ' + String(fieldName) + '.');
          return;
        }
        Object.defineProperty(object, fieldName, propertyDescriptor);
      }
    }, {
      key: 'parsePropertyDescriptor',
      value: function parsePropertyDescriptor(propertyDescriptor) {
        if (!propertyDescriptor || !(propertyDescriptor instanceof PropertyDescriptor)) {
          return new PropertyDescriptor(propertyDescriptor);
        }
        return propertyDescriptor;
      }
    }]);

    function SafeObject() {
      _classCallCheck(this, SafeObject);

      SafeObject.setInstanceProperties(this, SafeObject.SAFE_OBJECT_INITIALIZE);
    }

    _createClass(SafeObject, [{
      key: 'destroy',
      value: function destroy() {
        SafeObject.setInstanceProperties(this, SafeObject.SAFE_OBJECT_DESTROY);
      }
    }, {
      key: '_getIgnoredSafeObjectPropertyNames',
      value: function _getIgnoredSafeObjectPropertyNames() {
        return [];
      }
    }]);

    return SafeObject;
  }();

  SafeObject.SAFE_OBJECT_INITIALIZE = 1;
  SafeObject.SAFE_OBJECT_DESTROY = 2;

  SafeObject.INSTANCE_PROPERTIES = [['_isSafeObject', new PropertyDescriptor(true, false, false, false)]];

  SafeObject.PropertyDescriptor = PropertyDescriptor;

  if (typeof define === 'function' && define.amd) {
    define(SafeObject);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = SafeObject;
  } else {
    root[exportName] = SafeObject;
  }
})(undefined, 'SafeObject');