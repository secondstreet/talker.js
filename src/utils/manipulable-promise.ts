import { Promise } from 'es6-promise';

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

const cleanAndSettle = <T>(
  promise: ManipulablePromise<T>,
  settle: (value: any) => void, // tslint:disable-line: no-any
  value: T
): Promise<T> => {
  delete promise.__resolve__;
  delete promise.__reject__;
  settle(value);
  return promise;
};

const createManipulablePromise: <T>() => ManipulablePromise<T> = <T>(): ManipulablePromise<T> => {
  let resolve: (value: T) => void, reject: (error: Error) => void;
  const promise: ManipulablePromise<T> = new Promise<T>(
    (res: (value: T) => void, rej: (value: Error) => void): void => {
      resolve = res;
      reject = rej;
    }
  );
  promise.__resolve__ = (value: T): Promise<T> => cleanAndSettle(promise, resolve, value);
  promise.__reject__ = (error: T): Promise<T> => cleanAndSettle(promise, reject, error);
  return promise;
};

export default createManipulablePromise;
