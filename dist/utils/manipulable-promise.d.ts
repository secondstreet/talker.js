import { Promise } from "es6-promise";
/**
 * A class that adds "intimate" methods to allow the promise to be resolved or
 * rejected outside of its own constructor callback. It is not recommended that
 * you actually call those methods if you're a user of this library.
 */
export interface ManipulablePromise<T> extends Promise<T> {
    /**
     * Do not call this method if you are using talker.js -- it is for internal use only.
     * @private
     */
    __resolve__?(value: T): Promise<T>;
    /**
     * Do not call this method if you are using talker.js -- it is for internal use only.
     * @private
     */
    __reject__?(error: T): Promise<T>;
}
declare const createManipulablePromise: <T>() => ManipulablePromise<T>;
export default createManipulablePromise;
