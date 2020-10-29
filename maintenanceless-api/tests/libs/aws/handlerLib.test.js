import handler from "../../../libs/aws/handlerLib";

test("test that the handler throws 500 error if there is an uncaught exception with a generic error message", async () => {
  const testFunction = (event, context) => {
    throw new Error("TEST ERROR");
  }
  const testRequest = handler(testFunction);
  const result = await testRequest();
  expect(result.statusCode).toBe(500);

  const body = JSON.parse(result.body);
  expect(body.error).toBe("There was a problem fulfilling your request.");
});

test("test that the handler throws a 200 code if no other statusCode is returned", async () => {
  const testFunction = (event, context) => {
    return {
      body: {
        result: "Happy result!"
      }
    };
  };
  const testRequest = handler(testFunction);
  const result = await testRequest();
  expect(result.statusCode).toBe(200);

  const body = JSON.parse(result.body);
  expect(body.error).toBe(undefined);
  expect(body.result).toBe("Happy result!");
});

test("test that the handler throws a the code from the service an actual statusCode is returned", async () => {
  const testFunction = (event, context) => {
    return {
      statusCode: 400,
      body: {
        error: "Bad Request"
      }
    };
  };
  const testRequest = handler(testFunction);
  const result = await testRequest();
  expect(result.statusCode).toBe(400);

  const body = JSON.parse(result.body);
  expect(body.error).toBe("Bad Request");
});