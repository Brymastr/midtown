import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Orchestrator } from './Orchestrator';

const MOCK_EVENT: APIGatewayProxyEvent = {
  body: 'before',
  headers: undefined,
  multiValueHeaders: undefined,
  httpMethod: '',
  isBase64Encoded: false,
  path: '',
  pathParameters: undefined,
  queryStringParameters: undefined,
  multiValueQueryStringParameters: undefined,
  stageVariables: undefined,
  requestContext: undefined,
  resource: '',
};

/**
 * Orchestrator
 */
describe('Orchestrator', () => {
  it('should call attached functions in the order they were added', async () => {
    const firstMW = jest.fn((input: APIGatewayProxyEvent) =>
      Promise.resolve({ body: input.body + ', first' }),
    );
    const secondMW = jest.fn((input: APIGatewayProxyEvent) =>
      Promise.resolve({ body: input.body + ', second' }),
    );
    const thirdMW = jest.fn((input: APIGatewayProxyEvent) =>
      Promise.resolve({ body: input.body + ', third' }),
    );
    const handler = new Orchestrator().use(firstMW).use(secondMW).use(thirdMW).apiGatewayHandler();
    const res = await handler(MOCK_EVENT, undefined, undefined);
    expect(firstMW).toHaveBeenCalledTimes(1);
    expect(secondMW).toHaveBeenCalledTimes(1);
    expect(thirdMW).toHaveBeenCalledTimes(1);
    expect((res as APIGatewayProxyResult).body).toEqual('before, first, second, third');
  });

  it('should pass errors to the provided error handling function', async () => {
    const errorHandler = jest.fn((err: Error) => {
      return err.message;
    });
    const errorFunction = jest.fn((input: APIGatewayProxyEvent) => {
      if (input.body === 'before') {
        throw new Error('test-error');
      }
      return Promise.resolve(input);
    });
    const handler = new Orchestrator().use(errorFunction).catch(errorHandler).apiGatewayHandler();
    await handler(MOCK_EVENT, undefined, undefined);
    expect(errorFunction).toHaveBeenCalledTimes(1);
    expect(errorHandler).toHaveReturnedWith('test-error');
  });

  it('should throw error if called without an error handler and an error occurs', async () => {
    let errorThrown: false | string = false;
    try {
      const errorFunction = jest.fn(() => {
        throw new Error('test-error');
      });
      const handler = new Orchestrator().use(errorFunction).apiGatewayHandler();
      await handler(MOCK_EVENT, undefined, undefined);
    } catch (err) {
      errorThrown = err.message;
    }
    expect(errorThrown).toEqual('test-error');
  });

  it('should work even without specifying any use functions', async () => {
    const handlerClass = new Orchestrator();
    const handler = handlerClass.apiGatewayHandler();
    const res = await handler(MOCK_EVENT, undefined, undefined);
    expect((res as APIGatewayProxyResult).body).toEqual('before');
    expect(handlerClass['functions'].length).toEqual(0);
  });
});
