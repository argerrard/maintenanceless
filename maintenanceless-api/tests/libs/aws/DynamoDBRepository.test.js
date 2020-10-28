import DynamoDBRepository from "../../../libs/aws/DynamoDBRepository";
import errors from "../../../libs/constants/errors";

/**
 * Tests cases for creating new items in DynamoDB are below.
 * 
 */
describe("test that DynamoDB repository create function creates items", () => {
  let mockDynamoPut;
  let client;
  let repository;

  beforeEach(() => {
    mockDynamoPut = jest.fn();
    mockDynamoPut.mockReturnValue({
      promise: jest.fn()
    });

    client = {
      put: mockDynamoPut
    };

    // Set up the repository
    repository = new DynamoDBRepository("Dogs", client);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("trying to create a new item without a any data should return an error", async () => {
    const { error } = await repository.create(undefined, {
      primaryKeyField: "name"
    });
    expect(error).toBe(errors.MISSING_OPTION_EXCEPTION);
  });

  test("trying to create a new item without a primary key field should return an error", async () => {
    const testItem = {
      name: "Fred"
    };
    const { error } = await repository.create(testItem, {});
    expect(error).toBe(errors.MISSING_OPTION_EXCEPTION);
  });

  test("if DynamoDB returns a conditional check failed Exception, this should be reported to the repository caller", async () => {
    // Set up DynamoDB Mock that throws a conditional check failed exception
    const conditionalDynamoPut = jest.fn();
    const promiseFn = jest.fn();
    
    promiseFn.mockRejectedValueOnce({
      code: "ConditionalCheckFailedException"
    });

    conditionalDynamoPut.mockReturnValue({
      promise: promiseFn
    });

    client = {
      put: conditionalDynamoPut
    };

    // Initialize repository with the client that throws a conditional check failed
    repository = new DynamoDBRepository("Dogs", client);
    const testItem = {
      name: "Fred"
    };

    const { error } = await repository.create(testItem, {
      primaryKeyField: "name"
    });
    expect(error).toBe(errors.KEY_EXISTS_EXCEPTION);
  });

  test("if DynamoDB returns an error, we should inform the caller with a ITEM_CREATION_EXCEPTION", async () => {});

  test("attempting to create an item writes the item to the correct table with the correct data", async () => {});

  test("attempting to create an item without an overwrite option should default overwrite to false", async () => {});

  test("attempting to create an item with overwrite option set to true should ignore the conditional check", async () => {});

  test("attempting to create an item with overwrite option set to false should use conditonal check", async () => {});
});


/**
 * Tests cases for updating items in DynamoDB are below.
 * 
 */


 /**
 * Tests cases for creating fetching items in DynamoDB are below.
 * 
 */