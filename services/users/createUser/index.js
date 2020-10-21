var AWS = require("aws-sdk");
var db = new AWS.DynamoDB.DocumentClient();
var stepfunctions = new AWS.StepFunctions();
const bcrypt = require('bcrypt');

const HASH_ROUNDS = 10;
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

  let { email, password } = JSON.parse(event.body);

  if (!email || !password) {
    return invalidRequestResponse;
  }

  // Check that email is a valid format before proceeding
  if (!isValidEmail(email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'The e-mail provided was an invalid format'
      })
    };
  }

  // Lower case e-mail so that we don't have duplicate entries in our database
  email = email.toLowerCase();
  
  // Hash the password that was entered
  let hashResult;
  try {
    hashResult = await generatePasswordHash(email, password);
  } catch (hashError) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: hashError
      })
    };
  }

  // Generate the six digit confirmation code and create the user as unverified in the DB
  const confirmationCode = generateConfirmationCode();
  const { result, error } = await createUnverifiedUser(
    email,
    hashResult,
    confirmationCode
  );

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
 * Function that returns a promise containing the result of hashing the provided
 * password. The salt is auto-generated.
 * 
 * @param {String} email user's e-mail for logging purposes
 * @param {String} password the password to be hashed by bcrypt
 */
function generatePasswordHash(email, password) {
  return new Promise((resolve, reject) => {
      bcrypt.hash(password, HASH_ROUNDS, function(hashError, hashResult) {
      if (hashError) {
        console.error('Error creating hash for user: ', email);
        console.error(hashError);
        reject('There was a problem creating the user.');
      }
      return resolve(hashResult);
    })
  });
}

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

/**
 * Generates a confirmation code that the user is required to enter when registering.
 * Confirmation codes are a string of digits that is always six digits long.
 * 
 */
function generateConfirmationCode() {
  return Math.random().toString().split('.')[1].substring(0,6);
}