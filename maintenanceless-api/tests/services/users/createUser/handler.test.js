import User from "../../../../models/User";
import { main } from "../../../../services/users/createUser/handler"
import errors from "../../../../libs/constants/errors";

const mockCreateUser = jest.fn();
jest.mock("../../../../models/User", () => {
  return function () {
    return {createUser: mockCreateUser};
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

test("if there is no event body, return an invalid request response", async () => {
  let event = {};
  const result = await main(event);
  expect(result.statusCode).toBe(400);
  expect(result.body).toBe(JSON.stringify({ error: "E-mail and password are required to create a new user." }));
});

test("if there is no email in the body, return an invalid request response", async () => {
  let event = {
    body: JSON.stringify({
      password: 'test'
    })
  };
  const result = await main(event);
  expect(result.statusCode).toBe(400);
  expect(result.body).toBe(JSON.stringify({ error: "E-mail and password are required to create a new user." }));
});

test("if there is no password in the body, return an invalid request response", async () => {
  let event = {
    body: JSON.stringify({
      email: "test@test.com"
    })
  };
  const result = await main(event);
  expect(result.statusCode).toBe(400);
  expect(result.body).toBe(
    JSON.stringify({
      error: "E-mail and password are required to create a new user."
    })
  );
});

test("if the email is an invalid format, return a 400 error", async () => {
  let event = {
    body: JSON.stringify({
      email: "testtest.com",
      password: "testing"
    })
  };
  const result = await main(event);
  expect(result.statusCode).toBe(400);
  expect(result.body).toBe(
    JSON.stringify({
      error: "The e-mail provided was an invalid format."
    })
  );
});

test("ensure that the User model is called with lower cased email and password", async () => {
  let event = {
    body: JSON.stringify({
      email: "TEST@TEST.com",
      password: "testing"
    })
  };

  await main(event);
  expect(mockCreateUser.mock.calls[0][0]).toBe("test@test.com");
  expect(mockCreateUser.mock.calls[0][1]).toBe("testing");
});

test("check that if the error is a user already exists, a 409 is returned", async () => {
  mockCreateUser.mockImplementation(() => {
    return {
      error: "Key already exists",
      errorKey: errors.KEY_EXISTS_EXCEPTION
    };
  })
  let event = {
    body: JSON.stringify({
      email: "TEST@TEST.com",
      password: "testing"
    })
  };

  const result = await main(event);
  expect(result.statusCode).toBe(409);
  expect(result.body).toBe(JSON.stringify({ error: "The e-mail provided is already registered."}));
});

test("check that if the error is not a key we know, a 500 is returned", async () => {
  mockCreateUser.mockImplementation(() => {
    return {
      error: "ERROR"
    };
  });
  let event = {
    body: JSON.stringify({
      email: "TEST@TEST.com",
      password: "testing"
    })
  };

  const result = await main(event);
  expect(result.statusCode).toBe(500);
  expect(result.body).toBe(JSON.stringify({ error: "There was a problem registering the account."}));
});

test("successful user creation", async () => {
  mockCreateUser.mockImplementation(() => {
    return {
      result: "success"
    };
  });
  let event = {
    body: JSON.stringify({
      email: "TEST@TEST.com",
      password: "testing"
    })
  };

  const result = await main(event);
  expect(result.statusCode).toBe(200);
  expect(result.body).toBe(
    JSON.stringify({ result: "User successfully created." })
  );
});

