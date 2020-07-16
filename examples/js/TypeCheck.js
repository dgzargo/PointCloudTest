function Validator() {}

Validator.throwParamIfFalse = function (condition, param) {
    if(!condition){
        console.warn(param);
    }
}

Validator.validateType = function (type, value){
    Validator.throwParamIfFalse(typeof value === type, ['wrong type!', value, type]);
}

Validator.validateString = function (value) {
    Validator.validateType('string', value);
}

Validator.validateNumber = function (value) {
    Validator.validateType('number', value);
}

Validator.validateFunction = function (value) {
    Validator.validateType('function', value);
}

Validator.validateBool = function (value) {
    Validator.validateType('boolean', value);
}

Validator.validateArray = function (value, eachValueValidator) {
    Array.isArray(value);
    Array.prototype.forEach.call(value, eachValueValidator);
}

Validator.validateInstance = function (value, constructorFunction) {
    Validator.throwParamIfFalse(value instanceof constructorFunction, ['wrong type!', value, constructorFunction.name]);
}