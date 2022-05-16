/**
 * This class can be used to build an API Gateway or EventBridge triggered Lambda function
 * that is composed of multiple smaller functions. It exposes a use function
 * that adds functions in order to a list and uses functional composition to
 * produce one function with the input of the first and the return type of the last.
 * It also exposes a catch function that will catch any errors from any piped function
 * before the final return. It can be used to return an error response to API Gateway instead
 * of just crashing and resulting in a 500.
 */

import type { APIGatewayProxyHandler, EventBridgeHandler } from 'aws-lambda';

type Fn = (input: unknown) => Promise<unknown> | unknown;
type ErrorHandler = (err: unknown) => unknown;

export class Orchestrator<TDetail> {
  private functions: Fn[] = [];
  private errorHandler: ErrorHandler;

  public use(fn: Fn) {
    this.functions.push(fn);
    return this;
  }

  public catch(fn: ErrorHandler) {
    this.errorHandler = fn;
    return this;
  }

  private async reducer(event: any) {
    return this.functions.reduce(async (arg, fn) => fn(await arg), Promise.resolve(event));
  }

  public eventBridgeHandler() {
    const composedFunction: EventBridgeHandler<string, TDetail, unknown> = async (event, _) => {
      try {
        return await this.reducer(event);
      } catch (err) {
        if (this.errorHandler !== undefined) {
          return this.errorHandler.call(this, err);
        } else throw err;
      }
    };

    return composedFunction;
  }

  public apiGatewayHandler() {
    const composedFunction: APIGatewayProxyHandler = async (event, _) => {
      try {
        return await this.reducer(event);
      } catch (err) {
        if (this.errorHandler !== undefined) {
          return this.errorHandler.call(this, err);
        } else throw err;
      }
    };

    return composedFunction;
  }
}
