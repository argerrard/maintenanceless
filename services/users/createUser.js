var AWS = require("aws-sdk");
var db = new AWS.DynamoDB.DocumentClient();
var stepfunctions = new AWS.StepFunctions();

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
  // TODO: validate format of the email to ensure it is proper (and lowercase it)
  // 1. This function will store username, hashed password and activation code in Users table
  // 2. Pass the username (email) and confirmation to the next step - this will send an SES email to the user with a verification code
  // 3. Pause until the verification code is entered, after 8 hours remove from pending users
  // 4. If code is entered, move the user to actual users
  const confirmationCode = 12345;
  const { result, error } = await createUnverifiedUser(email, password, confirmationCode);

  // There was a problem adding the user to the database
  if (error) {
    return {
      statusCode: 409,
      body: JSON.stringify({
        error
      })
    };
  }

  // User was added successfully and step function was triggered
  return {
    statusCode: 201,
    body: JSON.stringify({
      message: result
    })
  };
};

/**
 * Function to create an unverified user in the database. The function
 * returns an the appropriate error message to be sent back to the front end
 * if the user could not be created.
 * 
 * @param {String} email 
 * @param {String} password 
 * @param {Number} confirmationCode 
 */
async function createUnverifiedUser(email, password, confirmationCode) {
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

    // Start up step function to send the confirmation e-mail
    await startEmailSteps(email, confirmationCode);
    return {
      result: `A verification code has been sent to ${email}.`
    };
  } catch (err) {
    // Username already exists
    if (err.code === "ConditionalCheckFailedException") {
      console.error(`Could not create user: ${email}. Email already exists.`);
    }
    
    console.error(err);
    return {
      error: "There was a problem registering the account - the e-mail may already be in use."
    };
  }
}

/**
 * Function to start the step function responsible for sending the e-mail to the newly registered user
 * containing the confirmation code.
 * 
 * @param {String} email 
 * @param {Number} confirmationCode 
 */
async function startEmailSteps(email, confirmationCode) {
  const params = {
    stateMachineArn: process.env.statemachine_arn,
    input: JSON.stringify({
      email,
      confirmationCode
    })
  };

  try {
    await stepfunctions.startExecution(params).promise();
    console.info(`Step function started to send verification e-mail for ${email}`);
  } catch (err) {
    console.error(`Failed to start step function to send verification e-mail for ${email}`);
    console.error(err);
  }
};