import { Promise } from "es6-promise";
var cleanAndSettle = function (promise, settle, // tslint:disable-line: no-any
value) {
    delete promise.__resolve__;
    delete promise.__reject__;
    settle(value);
    return promise;
};
var createManipulablePromise = function () {
    var resolve, reject;
    var promise = new Promise(function (res, rej) {
        resolve = res;
        reject = rej;
    });
    promise.__resolve__ = function (value) {
        return cleanAndSettle(promise, resolve, value);
    };
    promise.__reject__ = function (error) {
        return cleanAndSettle(promise, reject, error);
    };
    return promise;
};
export default createManipulablePromise;
//# sourceMappingURL=manipulable-promise.js.map