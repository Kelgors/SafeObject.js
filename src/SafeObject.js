(function (exportName) {

  function warn() {
    if (typeof console === 'undefined' || !SafeObject.debugMode) return;
    if (console.warn) console.warn.apply(console, arguments);
    else if (console.log) console.log.apply(console, arguments);
  }

  const _registered_constructors = [];

  class PropertyDescriptor {
    constructor(value, enumerable, writable, configurable, valueIsFactory) {
      this.enumerable = typeof enumerable === 'undefined' ? true : enumerable;
      this.writable = typeof writable === 'undefined' ? true : writable;
      this.configurable = typeof configurable === 'undefined' ? true : configurable;
      const registeredConstructor = SafeObject.getRegisteredConstructor(value);
      if (registeredConstructor) {
        this.value = registeredConstructor.construct.bind(registeredConstructor);
        this.isFactory = true;
      } else {
        this.isFactory = typeof value === 'function' && typeof valueIsFactory === 'undefined' ? true : valueIsFactory || false;
        this.value = value;
      }
    }

    clone() {
      return new PropertyDescriptor(this.value, this.enumerable, this.writable, this.configurable, this.isFactory);
    }

    toObject() {
      return {
        value: this.isFactory ? this.value(this) : this.value,
        enumerable: this.enumerable,
        writable: this.writable,
        configurable: this.configurable
      };
    }
  }

  class RegisteredConstructor {
    constructor(ConstructorFunction) {
      this.ConstructorFunction = ConstructorFunction;
    }
    construct() {
      return new (this.ConstructorFunction)();
    }
  }

  class SafeObject {

    static debug(instance) {
      const buffer = [];
      buffer.push('----- SafeObject debug -----');
      buffer.push('Constructor: ' + String(instance.constructor.name));
      buffer.push('_isSafeObject: ' + String(!!instance._isSafeObject));
      if (instance._isSafeObject) {
        const ancestors = SafeObject.getAncestors(instance);
        buffer.push('Ancestors: ' + ancestors.map(function (d) {return d.name;}).join(' < '));
        const attributeNames = SafeObject.getRegisteredPropertyNames(instance);
        const registeredAttributeNames = instance._getIgnoredSafeObjectPropertyNames().concat(attributeNames);
        const unregisteredAttributeNames = Object.getOwnPropertyNames(instance).filter(function (d)  { return registeredAttributeNames.indexOf(d) === -1; });
        buffer.push('ignored properties: ' + instance._getIgnoredSafeObjectPropertyNames().join(', '));
        buffer.push('registered properties: ' + attributeNames.join(', '));
        buffer.push('unregistered properties: ' + unregisteredAttributeNames.join(', '));
      }
      return buffer.join('\n');
    }

    static include(instance, options = {}) {
      if (SafeObject.isSafeObject(instance)) return instance;
      if (!instance.constructor.INSTANCE_PROPERTIES) {
        instance.constructor.INSTANCE_PROPERTIES = {};
      }
      const instanceProperties = instance.constructor.INSTANCE_PROPERTIES;

      if (!('_isSafeObject' in instanceProperties)) {
        instanceProperties._isSafeObject = new PropertyDescriptor(true, false, false, false);
      }

      [
        { methodName: 'destroy', returnsMerge: 'super' },
        { methodName: '_getIgnoredSafeObjectPropertyNames', returnsMerge: 'concat' }
      ].forEach(function ({ methodName, returnsMerge }) {
        // check if property exists and is a method
        const hasProperty = methodName in instance;
        const isFunction = typeof instance[methodName] === 'function';
        const _superMethod = instance[methodName];
        if (options.force && hasProperty) {
          warn('Overriding ' + methodName + ' method');
        }
        // define the method only if it hasnt the property or 'force' is true
        if (hasProperty && options.force || !hasProperty) {
          if (!(methodName in instanceProperties)) {
            instanceProperties[methodName] = new PropertyDescriptor(
              isFunction ? overrideMethod : SafeObject.prototype[methodName],
              false, true, true, false
            );
          }
        }

        function overrideMethod() {
          const superOut = _superMethod.apply(this, arguments);
          const safeObjectOut = SafeObject.prototype[methodName].call(this);
          let out;
          switch (returnsMerge) {
            case 'super': out = superOut; break;
            case 'concat': out = (superOut || []).concat(safeObjectOut || []); break;
          }
          return out;
        }
      });

      SafeObject.setProperties(instance, SafeObject.SAFE_OBJECT_INITIALIZE, Object.assign(instanceProperties, SafeObject.INSTANCE_PROPERTIES));

      return instance;
    }

    static getRegisteredConstructor(ConstructorFunction) {
      return _registered_constructors.find((d) => { return d.ConstructorFunction === ConstructorFunction; });
    }

    static registerConstructor(ConstructorFunction) {
      _registered_constructors.push(new RegisteredConstructor(ConstructorFunction));
    }

    static unregisterConstructor(ConstructorFunction) {
      const index = _registered_constructors.findIndex((d) => { return d.ConstructorFunction === ConstructorFunction; });
      return _registered_constructors.splice(index, 1)[0];
    }

    static isSafeObject(object) {
      return object && object._isSafeObject === true;
    }

    static getAncestors(object) {
      let current = object.constructor;
      const out = [];
      while (current = Object.getPrototypeOf(current.prototype) ? Object.getPrototypeOf(current.prototype).constructor : null) {
        out.push(current || []);
      }
      return out;
    }

    static getRegisteredProperties(safeObject) {
      const instanceProperties = [ safeObject.constructor ].concat(SafeObject.getAncestors(safeObject)).map(function (Constructor) {
        return Constructor.INSTANCE_PROPERTIES;
      }).reverse();
      instanceProperties.unshift({});
      return Object.assign(...instanceProperties);
    }

    static getUnregisteredPropertyNames(safeObject) {
      const registeredAttributeNames = SafeObject.getRegisteredPropertyNames(safeObject);
      registeredAttributeNames.push.apply(registeredAttributeNames, safeObject._getIgnoredSafeObjectPropertyNames());
      return Object.getOwnPropertyNames(safeObject).filter(function (propertyName)  {
        return registeredAttributeNames.indexOf(propertyName) === -1;
      });
    }

    static getRegisteredPropertyNames(safeObject) {
      return Object.getOwnPropertyNames(SafeObject.getRegisteredProperties(safeObject));
    }

    static setInstanceProperties(safeObject, state) {
      SafeObject.setProperties(safeObject, state, SafeObject.getRegisteredProperties(safeObject));
    }

    static setProperties(object, state, propertyDescriptors) {
      for (const propertyName in propertyDescriptors) {
        try {
          const propertyDescriptor = SafeObject.parsePropertyDescriptor(propertyDescriptors[propertyName]);
          SafeObject.setProperty(object, propertyName, propertyDescriptor, state);
        } catch (err) {
          warn('SafeObject#setProperties: ' + err.toString());
        }
      }
    }

    static setProperty(object, fieldName, propertyDescriptor, state) {
      if (!propertyDescriptor) {
        warn('Property descriptor isnt well formed for ' + String(fieldName) + '.');
        return;
      }
      Object.defineProperty(object, fieldName, propertyDescriptor.toObject());
    }

    static parsePropertyDescriptor(propertyDescriptor) {
      if (!propertyDescriptor || !(propertyDescriptor instanceof PropertyDescriptor)) {
        return new PropertyDescriptor(propertyDescriptor);
      }
      return propertyDescriptor;
    }


    constructor() {
      SafeObject.setInstanceProperties(this, SafeObject.SAFE_OBJECT_INITIALIZE);
      this._isDestroyed = false;
    }

    destroy() {
      SafeObject.setInstanceProperties(this, SafeObject.SAFE_OBJECT_DESTROY);
      this._isDestroyed = true;
    }

    _getIgnoredSafeObjectPropertyNames() {
      return [ '_isDestroyed' ];
    }

  }

  SafeObject.debugMode = false;
  SafeObject.VERSION = '1.2.0';
  SafeObject.SAFE_OBJECT_INITIALIZE = 1;
  SafeObject.SAFE_OBJECT_DESTROY = 2;

  SafeObject.INSTANCE_PROPERTIES = {
    _isSafeObject: new PropertyDescriptor(true, false, false, false)
  };

  SafeObject.PropertyDescriptor = PropertyDescriptor;

  SafeObject.registerConstructor(Object);
  SafeObject.registerConstructor(Array);
  SafeObject.registerConstructor(Date);
  SafeObject.registerConstructor(Map);
  SafeObject.registerConstructor(Set);

  if (typeof define === 'function' && define.amd) {
    define(function () {
      return SafeObject;
    });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = SafeObject;
  } else {
    this[exportName] = SafeObject;
  }
})('SafeObject');


