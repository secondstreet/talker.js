import { Promise } from 'es6-promise';

export interface ManipulablePromise<T> extends Promise<T> {
  __resolve__?(value: T): Promise<T>;
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
  const promise: ManipulablePromise<T> = new Promise<
    T
  >((res: (value: T) => void, rej: (value: Error) => void): void => {
    resolve = res;
    reject = rej;
  });
  promise.__resolve__ = (value: T): Promise<T> => cleanAndSettle(promise, resolve, value);
  promise.__reject__ = (error: T): Promise<T> => cleanAndSettle(promise, reject, error);
  return promise;
};

export default createManipulablePromise;
