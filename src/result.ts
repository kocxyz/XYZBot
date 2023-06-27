import { createLogger } from './logging';

const logger = createLogger('General');

/**
 * The success Result
 */
export interface SuccessResult<T> {
  /**
   * The type of the result
   */
  type: 'success';
  /**
   * The data of the success result
   */
  data: T;
}

/**
 * The failure Result
 */
export interface FailureResult<T> {
  /**
   * The type of the result
   */
  type: 'error';
  /**
   * The error type
   */
  error: T;
  /**
   * The failure message
   */
  message: string;
}

/**
 * Create a {@link SuccessResult successful Result} with given Data.
 *
 * @param data The data of the Result
 *
 * @returns The Success Result
 */
export function Success<T>(data: T): SuccessResult<T> {
  return {
    type: 'success',
    data: data,
  };
}

/**
 * Create a {@link FailureResult failure Result} with given error type and message.
 *
 * @param error The error type
 * @param message The failure message
 *
 * @returns The Failure Result
 */
export function Failure<T>(
  error: T | 'internal',
  message: string,
): FailureResult<T | 'internal'> {
  if (error === 'internal') {
    logger.error(message);
  }

  return {
    type: 'error',
    error: error,
    message: message,
  };
}

/**
 * Create an internal {@link FailureResult failure Result} from a given error.
 *
 * @param error The error
 *
 * @returns The Failure Result
 */
export function InternalErrorFailure(error: Error): FailureResult<'internal'> {
  return Failure('internal', JSON.stringify(error));
}

/**
 * The Result of an Operation
 */
export type Result<D, E = never> =
  | SuccessResult<D>
  | FailureResult<E | 'internal'>;

/**
 * Unwraps a Result.
 *
 * @param result The result to unwrap
 * @param fallback The fallback value if the Result is an FailureResult
 *
 * @returns The Result data or fallback
 */
export function unwrapResult<Data, Fallback>(
  result: Result<Data, unknown>,
  fallback: Fallback,
): Data | Fallback {
  if (result.type === 'error') {
    return fallback;
  }

  return result.data;
}
