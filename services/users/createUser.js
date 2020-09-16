var AWS = require("aws-sdk");
var db = new AWS.DynamoDB.DocumentClient();

const invalidRequestResponse = {
  statusCode: 400,
  body: JSON.stringify({
    error: "E-mail and password are required to create a new user."
  })
};

exports.handler = async (event, context) => {
  if (!event.body) {
    return invalidRequestResponse;
  }

  const { email, password } = JSON.parse(event.body);

  if (!email || !password) {
    return invalidRequestResponse;
  }
  
  // TODO: Salt and hash the password instead of storing in plain text
  // TODO: Generate the confirmation code
  // TODO: validate format of the email to ensure it is proper
  // 1. This function will store username, hashed password and activation code in Users table
  // 2. Pass the username (email) and confirmation to the next step - this will send an SES email to the user with a verification code
  // 3. Pause until the verification code is entered, after 8 hours remove from pending users
  // 4. If code is entered, move the user to actual users
  const confirmationCode = 12345;
  const params = {
    TableName: "Users",
    Item: {
      email,
      isVerified: false,
      confirmationCode,
      password
    },
    ConditionExpression: "attribute_not_exists(email)"
  };

  try {
    await db.put(params).promise();
    console.info(`User: ${email} successfully created.`);
    // TODO: send a message to SQS queue to start up the e-mail send
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: `A verification code has been sent to ${email}.`
      })
    };
  } catch (err) {
    // Username already exists
    if (err.code === "ConditionalCheckFailedException") {
      const errorMessage = `Could not create user: ${email}. Email already exists.`;
      console.error(errorMessage);
      return {
        statusCode: 409,
        body: JSON.stringify({
          error: "There was a problem registering the account - the e-mail may already be in use."
        })
      };
    }
    console.error(err);
    return {
      statusCode: 409,
      body: JSON.stringify({
        error:
          "There was a problem registering the account - the e-mail may already be in use."
      })
    };
  }
};