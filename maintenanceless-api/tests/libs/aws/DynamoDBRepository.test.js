import DynamoDBRepository from "../../../libs/aws/DynamoDBRepository";
import errors from "../../../libs/constants/errors";

/**
 * Tests cases for creating new items in DynamoDB are below.
 * 
 */
describe("test that DynamoDB repository create function creates items and throws exception as expected", () => {
  let mockDynamoPut;
  let client;
  let repository;
  let testItem;

  beforeEach(() => {
    mockDynamoPut = jest.fn();
    mockDynamoPut.mockReturnValue({
      promise: jest.fn()
    });

    client = {
      put: mockDynamoPut
    };

    // Set up the repository
    repository = new DynamoDBRepository("Users", client);

    // Set up default testItem
    testItem = {
      name: "Fred"
    };
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
    repository = new DynamoDBRepository("Users", client);

    const { error } = await repository.create(testItem, {
      primaryKeyField: "name"
    });
    expect(error).toBe(errors.KEY_EXISTS_EXCEPTION);
  });

  test("if DynamoDB returns an error, we should inform the caller with a ITEM_CREATION_EXCEPTION", async () => {
    // Set up DynamoDB Mock that throws an unexpected error (ie: not conditional check)
    const unexpectedDynamoPut = jest.fn();
    const promiseFn = jest.fn();
    
    promiseFn.mockRejectedValueOnce({
      code: "UnExpectedError"
    });

    unexpectedDynamoPut.mockReturnValue({
      promise: promiseFn
    });

    client = {
      put: unexpectedDynamoPut
    };

    // Initialize repository with the client that throws a conditional check failed
    repository = new DynamoDBRepository("Users", client);

    const { error } = await repository.create(testItem, {
      primaryKeyField: "name"
    });
    expect(error).toBe(errors.ITEM_CREATION_EXCEPTION);
  });

  test("attempting to create an item writes the item to the correct table with the correct data", async () => {
    await repository.create(testItem, {
      primaryKeyField: "name"
    });

    // The parameters that DynamoDB is called with
    const actualParams = mockDynamoPut.mock.calls[0][0];

    // The item that we passed in should be passed to DynamoDB
    expect(actualParams.TableName).toBe("Users");

    // The table we in the construcor should be the table passed to DynamoDB
    expect(actualParams.Item).toBe(testItem);
  });

  test("attempting to create an item without an overwrite option should default overwrite to false", async () => {
    await repository.create(testItem, {
      primaryKeyField: "name"
    });

    // The parameters that DynamoDB is called with
    const actualParams = mockDynamoPut.mock.calls[0][0];
    expect(actualParams.ConditionExpression).toBe("attribute_not_exists(name)");
  });

  test("attempting to create an item with overwrite option set to true should ignore the conditional check", async () => {
    await repository.create(testItem, {
      primaryKeyField: "name",
      overwrite: true
    });

    // The parameters that DynamoDB is called with
    const actualParams = mockDynamoPut.mock.calls[0][0];
    expect(actualParams.ConditionExpression).toBe(undefined);
  });

  test("attempting to create an item with overwrite option set to false should use conditonal check", async () => {
    await repository.create(testItem, {
      primaryKeyField: "name",
      overwrite: false
    });

    // The parameters that DynamoDB is called with
    const actualParams = mockDynamoPut.mock.calls[0][0];
    expect(actualParams.ConditionExpression).toBe("attribute_not_exists(name)");
  });
});


/**
 * Tests cases for updating items in DynamoDB are below.
 * 
 */
describe("test that DynamoDB repository update function updates items and throws exceptions as expected", () => {
  
  let mockDynamoUpdate;
  let client;
  let repository;

  beforeEach(() => {
    mockDynamoUpdate = jest.fn();
    mockDynamoUpdate.mockReturnValue({
      promise: jest.fn()
    });

    client = {
      update: mockDynamoUpdate
    };

    // Set up the repository
    repository = new DynamoDBRepository("Users", client);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test("calls to update without a primaryKeyField are rejected with a MISSING_OPTION_EXCEPTION", async () => {
    const { error } = await repository.update("fred", {
      updates: { age: 30 }
    });

    expect(error).toBe(errors.MISSING_OPTION_EXCEPTION);
  });

  test("calls to update without any actual updates are rejected with a MISSING_OPTION_EXCEPTION", async () => {
    const { error } = await repository.update("fred", {
      updates: {}
    });

    expect(error).toBe(errors.MISSING_OPTION_EXCEPTION);
  });

  test("calls to update without an item id are rejected with a MISSING_OPTION_EXCEPTION", async () => {
    const { error } = await repository.update("", {
      updates: { age: 30 }
    });

    expect(error).toBe(errors.MISSING_OPTION_EXCEPTION);
  });

  test("on updates, table name and item key are being set correctly", async () => {
    await repository.update("laura", {
      updates: { name: "susan" }
    });
    const actualParams = mockDynamoUpdate.mock.calls[0][0];
    expect(actualParams.TableName).toBe("Users");
    expect(actualParams.Key).toBe({ name: "laura" });
  });
  
  test("the update expression and expression attributes are set correctly for one item", async () => {

  });

  test("the update expression and expression attributes are set correctly for multiple items", async () => {

  });

  test("on any errors while calling DynamoDB, an ITEM_UPDATE_EXCEPTION code is returned", async () => {

  });
});

 /**
 * Tests cases for fetching items in DynamoDB are below.
 * 
 */
describe("test that DynamoDB repository get function gets items and throws exceptions as expected", () => {
  test("", async () => {

  });
});