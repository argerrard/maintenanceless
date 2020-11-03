import User from "../../../../models/User";
import { main } from "../../../../services/users/verifyRegistration/handler";
import errors from "../../../../libs/constants/errors";

const VALIDATION_ERROR_MESSAGE = "Bad request - an email and confirmation code are required.";

const mockVerify = jest.fn()
jest.mock("../../../../models/User", () => {
  return function() {
    return { verifyUserRegistration: mockVerify };
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

test("if there is no event body, return an invalid request response", async () => {
  let event = {};
  const result = await main(event);
  expect(result.statusCode).toBe(400);
  expect(result.body).toBe(
    JSON.stringify({
      error: VALIDATION_ERROR_MESSAGE
    })
  );
});

test("if there is no email in the body, return an invalid request response", async () => {
  let event = {
    body: JSON.stringify({
      confirmationCode: 123456
    })
  };
  const result = await main(event);
  expect(result.statusCode).toBe(400);
  expect(result.body).toBe(
    JSON.stringify({
      error: VALIDATION_ERROR_MESSAGE
    })
  );
});

test("if there is no confirmation code in the body, return an invalid request response", async () => {
  let event = {
    body: JSON.stringify({
      email: "test@test.com"
    })
  };
  const result = await main(event);
  expect(result.statusCode).toBe(400);
  expect(result.body).toBe(
    JSON.stringify({
      error: VALIDATION_ERROR_MESSAGE
    })
  );
});

test("ensure that the User model is called with lower cased email and confirmationCode", async () => {
  let event = {
    body: JSON.stringify({
      email: "TEST@TEST.com",
      confirmationCode: 123456
    })
  };

  const result = await main(event);
  expect(mockVerify.mock.calls[0][0]).toBe("test@test.com");
  expect(mockVerify.mock.calls[0][1]).toBe(123456);
});

test("if verify user registration returns an error, return a 400 status code", async () => {
  let event = {
    body: JSON.stringify({
      email: "TEST@TEST.com",
      confirmationCode: 123456
    })
  };

  mockVerify.mockImplementation(() => {
    return {
      error: 'error'
    }
  });

  const result = await main(event);
  expect(result.statusCode).toBe(400);
  expect(result.body).toBe(JSON.stringify({ error: 'error' }));
});

test("if verify user registration is successful, return a 200 status code", async () => {
  let event = {
    body: JSON.stringify({
      email: "TEST@TEST.com",
      confirmationCode: 123456
    })
  };

  mockVerify.mockImplementation(() => {
    return {
      result: "success"
    };
  });

  const result = await main(event);
  expect(result.statusCode).toBe(200);
  expect(result.body).toBe(JSON.stringify({ result: "success" }));
});
