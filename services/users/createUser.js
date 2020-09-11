var AWS = require("aws-sdk");
var db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  const { email, password } = event;

  if (!email || !password) {
    throw new Error("E-mail and password are required to create a new user.");
  }

  // TODO: Salt and hash the password instead of storing in plain text
  // TODO: Generate the confirmation code
  // 1. This function will store username, hashed password and activation code in Users table
  // 2. Pass the username (email) and confirmation to the next step - this will send an SES email to the user with a verification code
  // 3. Pause until the verification code is entered, after 8 hours remove from pending users
  // 4. If code is entered, move the user to actual users
  const params = {
    TableName: "Users",
    Item: {
      email,
      isActive: false,
      confirmationCode: 1234,
      password
    },
    ConditionExpression: "attribute_not_exists(email)"
  };

  try {
    await db.put(params).promise();
    console.info(`User: ${email} successfully created.`);
    return {
      email,
      confirmationCode
    };
  } catch (err) {
    // Username already exists
    if (err.code === "ConditionalCheckFailedException") {
      const errorMessage = `Could not create user: ${email}. Email already exists.`;
      throw new Error(errorMessage);
    }
    throw new Error("Could not create the user.");
  }
};