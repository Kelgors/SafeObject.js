export default class SafeObject {

  static debug(instance) {
    console.log('----- SafeObject debug -----');
    console.log('Constructor: ', instance.constructor.name);
    console.log('_isSafeObject: ' + String(instance._isSafeObject));
    if (instance._isSafeObject) {
      const ancestors = instance._getAncestors();
      console.log('Ancestors: ' + instance._getAncestors().map(function (d) {return d.name;}).join(' > '));
      const attributeNames = instance._getAttributes().map(function (d) {
        if (Array.isArray(d)) return d[0];
        return d;
      });
      const registeredAttributeNames = [ '_isSafeObject', 'destroy', '_getAncestors', '_getAttributes', '_clearAllInstanceProperties', '_parsePropertyDescriptor' ].concat(attributeNames);
      const unregisteredAttributeNames = Object.getOwnPropertyNames(instance).filter(function (d)  { return registeredAttributeNames.indexOf(d) === -1; });
      console.log('registered attributes: ', attributeNames.join(', '));
      console.log('unregistered attributes: ', unregisteredAttributeNames.join(', '));
    }
  }

  static include(instance) {
    if (instance._isSafeObject) return instance;

    [ 'destroy', '_getAncestors', '_getAttributes', '_clearAllInstanceProperties', '_parsePropertyDescriptor' ].forEach(function (methodName) {
      if (methodName === 'destroy' && typeof instance[methodName] === 'function') {
        const oldMethod = instance[methodName];
        instance[methodName] = function () {
          SafeObject.prototype[methodName].call(this, arguments);
          oldMethod.apply(this, arguments);
        };
      } else {
        instance[methodName] = SafeObject.prototype[methodName];
      }
    });
    instance._isSafeObject = true;

    const properties = instance.constructor.INSTANCE_PROPERTIES;
    if (properties && properties.length) {
      instance._clearAllInstanceProperties(SafeObject.SAFE_OBJECT_INITIALIZE);
    }
    return instance;
  }

  constructor() {
    this._clearAllInstanceProperties(SafeObject.SAFE_OBJECT_INITIALIZE);
    this._isSafeObject = true;
  }

  destroy() {
    this._clearAllInstanceProperties(SafeObject.SAFE_OBJECT_DESTROY);
  }

  _getAncestors() {
    let current = this.constructor;
    const out = [];
    while (current = Object.getPrototypeOf(current.prototype) ? Object.getPrototypeOf(current.prototype).constructor : null) {
      out.push(current || []);
    }
    return out;
  }

  _getAttributes() {
    const ancestors = [ this.constructor ].concat(this._getAncestors());
    const out = [];
    for (let index = 0; index < ancestors.length; index++) {
      out.push.apply(out, ancestors[index].INSTANCE_PROPERTIES);
    }
    return out;
  }

  _clearAllInstanceProperties(state) {
    const Constructor = this.constructor;
    const instanceProperties = this._getAttributes();
    for (let index = 0; index < instanceProperties.length; index++) {
      try {
        const attributeDescriptor = instanceProperties[index];
        let fieldName, descriptor;
        if (typeof attributeDescriptor === 'string') {
          fieldName = attributeDescriptor;
          descriptor = this._parsePropertyDescriptor();
        } else if (Array.isArray(attributeDescriptor)) {
          fieldName = attributeDescriptor[0];
          descriptor = this._parsePropertyDescriptor(attributeDescriptor[1]);
        }
        if (state === SafeObject.SAFE_OBJECT_INITIALIZE && fieldName && descriptor) {
          Object.defineProperty(this, fieldName, descriptor);
        } else if (state === SafeObject.SAFE_OBJECT_DESTROY && fieldName) {
          if (this[fieldName] && typeof this[fieldName].destroy === 'function' && this._isSafeObject) {
            this[fieldName].destroy();
          }
          this[fieldName] = null;
        }
      } catch (err) {
        console.log('SafeObject#_clearAllInstanceProperties: ' + err.toString());
      }
    }
  }

  _parsePropertyDescriptor(propertyDescriptor) {
    if (!propertyDescriptor || propertyDescriptor.constructor !== Object) {
      return { writable: true, configurable: true, enumerable: true, value: null };
    }
    const descriptor = propertyDescriptor;
    if (!('value' in descriptor)) descriptor.value = null;
    if (!('enumerable' in descriptor)) descriptor.enumerable = true;
    if (!('configurable' in descriptor)) descriptor.configurable = true;
    if (!('writable' in descriptor)) descriptor.writable = true;
    return descriptor;
  }

}

SafeObject.SAFE_OBJECT_INITIALIZE = 1;
SafeObject.SAFE_OBJECT_DESTROY = 2;