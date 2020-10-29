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
      primaryKeyField: "name",
      updates: {}
    });

    expect(error).toBe(errors.MISSING_OPTION_EXCEPTION);
  });

  test("calls to update without an item id are rejected with a MISSING_OPTION_EXCEPTION", async () => {
    const { error } = await repository.update("", {
      updates: { age: 30 },
      primaryKeyField: "name"
    });

    expect(error).toBe(errors.MISSING_OPTION_EXCEPTION);
  });

  test("on updates, table name and item key are being set correctly", async () => {
    await repository.update("laura", {
      primaryKeyField: "name",
      updates: { age: 25 }
    });
    const actualParams = mockDynamoUpdate.mock.calls[0][0];
    expect(actualParams.TableName).toBe("Users");
    expect(actualParams.Key).toEqual({ name: "laura" });
    expect(actualParams.ConditionExpression).toBe("attribute_exists(name)");
  });
  
  test("the update expression and expression attributes are set correctly for one item", async () => {
    await repository.update("laura", {
      primaryKeyField: "name",
      updates: { age: 25 }
    });
    const actualParams = mockDynamoUpdate.mock.calls[0][0];
    expect(actualParams.UpdateExpression).toBe("SET age = :0");
    expect(actualParams.ExpressionAttributeValues).toEqual({ ":0": 25 });
  });

  test("the update expression and expression attributes are set correctly for multiple items", async () => {
    await repository.update("laura", {
      primaryKeyField: "name",
      updates: { age: 25, activity: "baseball" }
    });
    const actualParams = mockDynamoUpdate.mock.calls[0][0];
    expect(actualParams.UpdateExpression).toBe("SET age = :0, activity = :1");
    expect(actualParams.ExpressionAttributeValues).toEqual({ ":0": 25, ":1": "baseball" });
  });

  test("on any errors while calling DynamoDB, an ITEM_UPDATE_EXCEPTION code is returned", async () => {
    // Set up DynamoDB Mock that throws an unexpected error
    const unexpectedDynamoPut = jest.fn();
    const promiseFn = jest.fn();
    
    promiseFn.mockRejectedValueOnce({
      code: "UnExpectedError"
    });

    unexpectedDynamoPut.mockReturnValue({
      promise: promiseFn
    });

    client = {
      update: unexpectedDynamoPut
    };

    // Initialize repository with the client that throws a conditional check failed
    repository = new DynamoDBRepository("Users", client);

    const { error } = await repository.update("fred", {
      primaryKeyField: "name",
      updates: { age: 30 }
    });
    expect(error).toBe(errors.ITEM_UPDATE_EXCEPTION);
  });
});

 /**
 * Tests cases for fetching items in DynamoDB are below.
 * 
 */
describe("test that DynamoDB repository get function gets items and throws exceptions as expected", () => {

  let mockDynamoGet;
  let client;
  let repository;

  beforeEach(() => {
    mockDynamoGet = jest.fn();
    mockDynamoGet.mockReturnValue({
      promise: jest.fn()
    });

    client = {
      get: mockDynamoGet
    };

    // Set up the repository
    repository = new DynamoDBRepository("Users", client);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getting a item without a primaryKeyField throws a missing option exception", async () => {
    const { error } = await repository.get('jack', {});
    expect(error).toBe(errors.MISSING_OPTION_EXCEPTION);
  });

  test("getting a item without an id throws a missing option exception", async () => {
    const { error } = await repository.get('', { primaryKeyField: 'name' });
    expect(error).toBe(errors.MISSING_OPTION_EXCEPTION);
  });

  test("key and table name are set correctly when getting an item", async () => {
    await repository.get("jack", { primaryKeyField: "name" });
    const actualParams = mockDynamoGet.mock.calls[0][0];
    expect(actualParams.Key).toEqual({ name: 'jack' });
    expect(actualParams.TableName).toEqual('Users');
  });

  test("getting an item without specific attributes does not include projection expression", async () => {
    await repository.get("jack", { primaryKeyField: "name" });
    const actualParams = mockDynamoGet.mock.calls[0][0];
    expect(actualParams.ProjectionExpression).toBeUndefined();
  });

  test("getting an item with one attribute includes correct projection expression", async () => {
    await repository.get("jack", { primaryKeyField: "name", attributesToGet: ["age"] });
    const actualParams = mockDynamoGet.mock.calls[0][0];
    expect(actualParams.ProjectionExpression).toBe('age');
  });

  test("getting an item with multiple attributes includes correct projection expression", async () => {
    await repository.get("jack", { primaryKeyField: "name", attributesToGet: ["age", "address"] });
    const actualParams = mockDynamoGet.mock.calls[0][0];
    expect(actualParams.ProjectionExpression).toBe('age,address');
  });

  test("on unexpected DynamoDB errors, ITEM_GET_EXCEPTION is returned to the caller", async () => {
    // Set up DynamoDB Mock that throws an unexpected error
    const unexpectedDynamoGet = jest.fn();
    const promiseFn = jest.fn();
    
    promiseFn.mockRejectedValueOnce({
      code: "UnExpectedError"
    });

    unexpectedDynamoGet.mockReturnValue({
      promise: promiseFn
    });

    client = {
      get: unexpectedDynamoGet
    };

    // Initialize repository with the client that throws a conditional check failed
    repository = new DynamoDBRepository("Users", client);

    const { error } = await repository.get("fred", { primaryKeyField: "name"});
    expect(error).toBe(errors.ITEM_GET_EXCEPTION);
  });
});