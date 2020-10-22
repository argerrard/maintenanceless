import errors from "./errors";

class DynamoDBRepository {
  constructor(table, client) {
    this.db = client;
    this.table = table;
  }

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
      console.info(`${primaryKeyField} successfully created in table ${this.table}.`);
      return item;
    } catch (err) {
      // Username already exists
      if (err.code === "ConditionalCheckFailedException") {
        console.error(`Could not create entry for ${primaryKeyField}. Key already exists.`);
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
}

export default DynamoDBRepository;