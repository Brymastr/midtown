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
