// Mock the userAuthLib dependency
jest.mock("../../libs/utils/userAuthLib", () => ({
  __esModule: true,
  default: () => "",
  generateConfirmationCode: jest.fn(),
  generatePasswordHash: jest.fn(),
  isEnteredCodeValid: jest.fn()
}));

import { generateConfirmationCode, generatePasswordHash, isEnteredCodeValid } from "../../libs/utils/userAuthLib";
import User from "../../models/User";

const VALIDATION_ERROR = "An email and a password are required to create a user.";
const GENERIC_ERROR = "There was a problem creating the user."
const CONFIRMATION_CODE_ERROR = "Could not find a confirmation code for test@test.com.";
const SUCCESS_MESSAGE = "Success! test@test.com is activated and ready to start maintaining.";
const VERIFICATION_ERROR = 'There was a problem verifying the user with the provided confirmation code.';

let repository;
let userModel;

beforeEach(() => {
  const mockRepositoryCreate = jest.fn();
  const mockRepositoryGet = jest.fn();
  const mockRepositoryUpdate = jest.fn();
  repository = {
    create: mockRepositoryCreate,
    get: mockRepositoryGet,
    update: mockRepositoryUpdate
  };

  userModel = new User(repository);
});

afterEach(() => {
  jest.clearAllMocks();
});
/**
 * Tests creating a new User using the model
 * 
 */
test("that a email is required to create a new User", async () => {
  const { error } = await userModel.createUser(undefined, "testpw");
  expect(error).toBe(VALIDATION_ERROR);
});

test("that a password is required to create a new User", async () => {
  const { error } = await userModel.createUser("user", undefined);
  expect(error).toBe(VALIDATION_ERROR);
});

test("if hashing fails, an error is returned and the user is not created", async () => {
  generatePasswordHash.mockImplementation(() => {
    throw "hash error";
  });

  const { error } = await userModel.createUser("user", "testpassword");
  expect(error).toBe(GENERIC_ERROR);
});

test("if there is an error creating the user in the repository, the error key is returned", async () => {
  repository.create.mockImplementation(() => {
    throw "create error";
  });

  const { error } = await userModel.createUser("user", "testpassword");
  expect(error).toBe(GENERIC_ERROR);
});

test("the newly created user has an email, hashed password, isVerified set to false and a confirmation code", async () => {
  generatePasswordHash.mockImplementation(() => 'abcdefg');
  generateConfirmationCode.mockImplementation(() => 123456);
  repository.create.mockImplementation(() => { 
    return {
      result: 'Success' 
    };
  });

  const { result } = await userModel.createUser("user@user.com", "testpassword");

  const expectedParams = {
    confirmationCode: 123456,
    password: 'abcdefg',
    email: 'user@user.com',
    isVerified: false
  };
  expect(repository.create).toBeCalledWith(expectedParams, expect.anything());
  expect(result).toBe("User created successfully.");
});

test("options passed in to the repository create contains the correct primaryKeyField and overwrite", async () => {
  generatePasswordHash.mockImplementation(() => 'abcdefg');
  generateConfirmationCode.mockImplementation(() => 123456);
  repository.create.mockImplementation(() => { 
    return {
      result: 'Success' 
    };
  });

  await userModel.createUser("user@user.com", "testpassword");

  const expectedParams = {
    overwrite: false,
    primaryKeyField: "email"
  };
  expect(repository.create).toBeCalledWith(expect.anything(), expectedParams);
});


/**
 * Tests for checking if a user is verified using the model
 * 
 */
test("if the repository returns an error, false is returned", async () => {
  repository.get.mockImplementation(() => {
    return { error: "error getting value"}; 
  });

  const result = await userModel.isUserVerified("test@test.com");
  expect(result).toBe(false);
});

test("if the result from getting the repository doesn't have that field, false is returned", async () => {
  repository.get.mockImplementation(() => {
    return { result: {}}; 
  });

  const result = await userModel.isUserVerified("test@test.com");
  expect(result).toBe(false);
});

test("if the repository throws an error, false is returned", async () => {
  repository.get.mockImplementation(() => {
    throw "error getting data";
  });

  const result = await userModel.isUserVerified("test@test.com");
  expect(result).toBe(false);
});

test("options are passed correctly to the repository", async () => {
  repository.get.mockImplementation(() => {
    return { result: {} };
  });

  await userModel.isUserVerified("test@test.com");
  expect(repository.get).toBeCalledWith("test@test.com", {
    primaryKeyField: "email",
    attributesToGet: ["isVerified"]
  });
});

test("on a successful repository fetch, the result is returned", async () => {
  repository.get.mockImplementation(() => {
    return { 
      result: {
        isVerified: true
      }
    };
  });

  const result = await userModel.isUserVerified("test@test.com");
  expect(result).toBe(true);
});


/**
 * Tests for fetching a User's confirmation code using the model
 * 
 */
test("if the repository returns an error, error message is returned", async () => {
  repository.get.mockImplementation(() => {
    return { error: "error getting value" };
  });

  const { error } = await userModel.getUserConfirmationCode("test@test.com");
  expect(error).toBe(CONFIRMATION_CODE_ERROR);
});

test("if the result from getting the repository confirmation code field, error is returned", async () => {
  repository.get.mockImplementation(() => {
    return { result: {} };
  });

  const { error } = await userModel.getUserConfirmationCode("test@test.com");
  expect(error).toBe(CONFIRMATION_CODE_ERROR);
});

test("if the repository throws an error, error is returned", async () => {
  repository.get.mockImplementation(() => {
    throw "error getting data";
  });

  const { error } = await userModel.getUserConfirmationCode("test@test.com");
  expect(error).toBe(CONFIRMATION_CODE_ERROR);
});

test("options are passed correctly to the repository", async () => {
  repository.get.mockImplementation(() => {
    return {
      result: {
        confirmationCode: 123456
      }
    };
  });

  await userModel.getUserConfirmationCode("test@test.com");
  expect(repository.get).toBeCalledWith("test@test.com", {
    primaryKeyField: "email",
    attributesToGet: ["confirmationCode"]
  });
});

test("on a successful repository fetch, the result is returned", async () => {
  repository.get.mockImplementation(() => {
    return {
      result: {
        confirmationCode: 123456
      }
    };
  });

  const result = await userModel.getUserConfirmationCode("test@test.com");
  expect(result.confirmationCode).toBe(123456);
});

/**
 * Tests for activating a User using the model
 * 
 */
test("that activating a user is called with the correct options and user id", async () => {
  repository.update.mockImplementation(() => {
    return {
      result: "Success"
    }
  });
  
  const result = await userModel.activateUser("test@test.com");

  const expectedOptions = {
    primaryKeyField: "email",
    updates: {
      isVerified: true
    }
  };
  expect(repository.update).toBeCalledWith("test@test.com", expectedOptions);
  expect(result).toBe("Success");
});

test("that if user activation returns an error, the error and errorKey is returned", async () => {
  repository.update.mockImplementation(() => {
    return {
      error: "UPDATE_ERROR"
    };
  });

  const { error, errorKey } = await userModel.activateUser("test@test.com");

  expect(error).toBe("There was a problem activating the user.");
  expect(errorKey).toBe("UPDATE_ERROR");
});

/**
 * Tests for verifying a User's registration information and creating the account
 * using the model
 * 
 */
test("that verifying a user that is already verified will return an error", async () => {
  userModel.isUserVerified = jest.fn();
  userModel.isUserVerified.mockImplementation(() => true);

  const { error } = await userModel.verifyUserRegistration("test@test.com", 123456);
  expect(error).toBe(VERIFICATION_ERROR);
});

test("that if getting the correct confirmation code fails, an error will be returned", async () => {
  userModel.isUserVerified = jest.fn();
  userModel.isUserVerified.mockImplementation(() => false);

  userModel.getUserConfirmationCode = jest.fn();
  userModel.getUserConfirmationCode.mockImplementation(() => { return { error: "error" }; });

  const { error } = await userModel.verifyUserRegistration("test@test.com", 123456);
  expect(error).toBe(VERIFICATION_ERROR);
});

test("that if the entered code does not match the correct code, an error will be returned", async () => {
  userModel.isUserVerified = jest.fn();
  userModel.isUserVerified.mockImplementation(() => false);

  userModel.getUserConfirmationCode = jest.fn();
  userModel.getUserConfirmationCode.mockImplementation(() => {
    return { confirmationCode: 543212 };
  });

  isEnteredCodeValid.mockImplementation(() => false);

  const { error } = await userModel.verifyUserRegistration(
    "test@test.com",
    123456
  );
  expect(error).toBe('The supplied confirmation code did not match with the confirmation code on file.');
});

test("that if there is a problem activating the user, an error will be returned", async () => {
  userModel.isUserVerified = jest.fn();
  userModel.isUserVerified.mockImplementation(() => false);

  userModel.getUserConfirmationCode = jest.fn();
  userModel.getUserConfirmationCode.mockImplementation(() => {
    return { confirmationCode: 123456 };
  });

  userModel.activateUser = jest.fn();
  userModel.activateUser.mockImplementation(() => {
    return {
      error: "error"
    };
  });

  isEnteredCodeValid.mockImplementation(() => true);

  const { error } = await userModel.verifyUserRegistration(
    "test@test.com",
    123456
  );
  expect(error).toBe("There was a problem activating the user in the system.");
});

test("that if there are no errors in dependencies and the codes match, the success message is returned", async () => {
  userModel.isUserVerified = jest.fn();
  userModel.isUserVerified.mockImplementation(() => false);

  userModel.getUserConfirmationCode = jest.fn();
  userModel.getUserConfirmationCode.mockImplementation(() => {
    return { confirmationCode: 123456 };
  });

  userModel.activateUser = jest.fn();
  userModel.activateUser.mockImplementation(() => {
    return {
      result: "success"
    };
  });

  isEnteredCodeValid.mockImplementation(() => true);

  const { result } = await userModel.verifyUserRegistration(
    "test@test.com",
    123456
  );
  expect(result).toBe(SUCCESS_MESSAGE);
});



