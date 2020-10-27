import errors from "../constants/errors";

class DynamoDBRepository {
  constructor(table, client) {
    this.db = client;
    this.table = table;
  }

  /**
   * Creates a new item with the key of "item". Options can be passed in to adjust the functionality
   * of this method.
   *
   * Options include:
   *   primaryKeyField: String, required - the name of the attribute storing the primary key
   *   overwrite: Boolean, optional - if true, the create method will overwrite existing entries with the same key
   *
   * @param {String} item
   * @param {Object} options
   */
  async create(item, options) {
    const { overwrite = false, primaryKeyField } = options;

    if (!primaryKeyField) {
      console.error("A primary key field is required to create a new item.");
      return {
        error: errors.MISSING_OPTION_EXCEPTION
      };
    }

    const params = {
      TableName: this.table,
      Item: item
    };

    if (!overwrite && primaryKeyField) {
      params.ConditionExpression = `attribute_not_exists(${primaryKeyField})`;
    }

    try {
      await this.db.put(params).promise();
      console.info(`${item} successfully created in table ${this.table}.`);
      return item;
    } catch (err) {
      // Username already exists
      if (err.code === "ConditionalCheckFailedException") {
        console.error(
          `Could not create entry for ${item}. Key already exists.`
        );
        return {
          error: errors.KEY_EXISTS_EXCEPTION
        };
      }

      console.error(err);
      return {
        error: errors.ITEM_CREATION_EXCEPTION
      };
    }
  }

  /**
   * Updates an existing DynamoDB item in the specified table using the options provided.
   *
   * Options include:
   *   primaryKeyField: the attribute name representing the primary key field
   *   updates: the updates we want to make - this is a JSON object where each attribute represents
   *            the attribute we are updating in the table, and the value is the new value we want to use
   *
   * @param {String} id - id of the item we want to update
   * @param {Object} options - the options provided for the update
   */
  async update(id, options) {
    const { primaryKeyField, updates } = options;

    console.info(`Updating Table ${this.table} for ID ${id}`);

    if (!primaryKeyField) {
      console.error("A primary key field is required to create a new item.");
      return { error: errors.MISSING_OPTION_EXCEPTION };
    }

    if (!updates || updates.length === 0) {
      console.error("There must be at least one update to create a new item.");
      return { error: errors.MISSING_OPTION_EXCEPTION };
    }

    // Build the UpdateExpression and Expression Attribute Values from the provided updates
    let updateExpression = 'SET ';
    let expressionAttributeValues = {};
    let i = 0;
    for (const key in updates) {
      if (i > 0) {
        updateExpression += ', ';
      }
      updateExpression += `${key} = :${i}`;
      expressionAttributeValues[`:${i}`] = updates[key];
    }

    const params = {
      TableName: this.table,
      Key: { [primaryKeyField]: id },
      UpdateExpression: updateExpression,
      ConditionExpression: `attribute_exists(${primaryKeyField})`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "UPDATED_NEW"
    };

    console.info(`Updating Table: ${this.table} with params ${JSON.stringify(params)}.`);

    try {
      const result = await this.db.update(params).promise();
      console.info(result);
      return { result };
    } catch (err) {
      console.error(err);
      return {
        error: errors.ITEM_UPDATE_EXCEPTION
      };
    }
  }

  /**
   * Gets the data filtered by the attributes provided in the options for the id provided.
   *
   * Options include:
   *   primaryKeyField: String, required - the name of the attribute storing the primary key
   *   attributesToGet: [String], optional - an array of attributes to return to the model -
   *                              if the array is empty, the entire data associated with the entry is returned
   *
   * @param {String} id - the identifier to get the data for
   * @param {Object} options - options provided as defined above
   */
  async get(id, options) {
    const { primaryKeyField, attributesToGet = [] } = options;

    // A primary key field is required to fetch the data
    if (!primaryKeyField) {
      console.error("A primary key field is required to get an item's data.");
      return {
        error: errors.MISSING_OPTION_EXCEPTION
      };
    }

    const params = {
      Key: { [primaryKeyField]: id },
      TableName: this.table
    };

    // If specific attributes to get are specified, use a projection expression to get only them
    if (attributesToGet.length > 0) {
      params.ProjectionExpression = attributesToGet.join(",");
    }
    console.info("Requesting info from database with params: ", params);

    try {
      const result = await this.db.get(params).promise();
      console.info("Returning result", result.Item);
      return { result: result.Item };
    } catch (err) {
      console.error(err);
      return { error: errors.ITEM_GET_EXCEPTION };
    }
  }
}

export default DynamoDBRepository;