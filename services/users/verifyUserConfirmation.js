var AWS = require("aws-sdk");
var db = new AWS.DynamoDB.DocumentClient();
var stepfunctions = new AWS.StepFunctions();

const invalidRequestResponse = {
  statusCode: 400,
  body: JSON.stringify({
    error: "Bad request - an email and confirmation code are required."
  })
};

exports.handler = async (event, context) => {
  if (!event.body) {
    return invalidRequestResponse;
  }
  const { email, confirmationCode } = JSON.parse(event.body);

  if (!email || !confirmationCode) {
    return invalidRequestResponse;
  }

  // Get the confirmationCode stored in the database for the user
  // We can get the emailTaskToken at the same time to prevent unnecessary database reads
  let { code, error, statusCode, emailTaskToken } = await getUserConfirmationCode(email);

  if (error) {
    return {
      statusCode,
      body: JSON.stringify({
        error
      })
    };
  }

  // By this point, a valid code was found
  // Verify that the supplied code matches the generated code
  if (!isEnteredCodeValid(confirmationCode, code)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Sorry - that doesn't seem to be the right verification code."
      })
    };
  }

  console.info(`Verification successful for user ${email} - activating user.`);

  // Activate the user
  const result = await activateUser(email);

  if (result.error) {
    let error = result.error;
    return {
      statusCode: 500,
      body: JSON.stringify({
        error
      })
    };
  }

  // Trigger step function to send confirmation e-mail and close off the workflow
  try {
    await stepfunctions.sendTaskSuccess({
      output: "\"Callback task completed successfully.\"",
      taskToken: emailTaskToken
    }).promise();
  } catch(err) {
    console.error(`Failed to trigger step function for ${email}.`);
    console.error(err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: result.message
    })
  };
};


/**
 * Gets the correct registration confirmation code from the database as well as
 * the task token required for calling back the registration e-mail step function.
 * 
 * @param {String} email - the email of the user we are getting the confirmation for 
 */
async function getUserConfirmationCode(email) {
  const error = 'There was a problem validating your confirmation code.';
  const params = {
    'Key': { email },
    'ProjectionExpression': 'confirmationCode, isVerified, verificationToken',
    'TableName': 'Users'
  };

  try {
    const result = await db.get(params).promise();

    // Confirm if the result contains a user or if user does not exist
    const user = result.Item;
    if (!user) {
      console.info(`Could not find user ${email} to confirm`);
      return {
        error,
        statusCode: 400
      };
    }

    // Check if the user is marked as verified in the system already
    // If so, we don't need to go any further through the process
    if (user.isVerified) {
      console.info(`${email} tried to confirm but was already verified.`);
      return {
        error,
        statusCode: 400
      };
    }

    return {
      code: user.confirmationCode,
      emailTaskToken: user.verificationToken
    };
  } catch(err) {
    console.error("Could not get user confirmation code.", err);
    return {
      error,
      statusCode: 500
    };
  }
}


/**
 * Helper function to confirm that the code supplied by the user is valid.
 * Returns true if the verification code matches the database, false otherwise.
 * 
 * @param {Number} enteredCode - the code entered by the user
 * @param {Number} correctCode - the code created when the user initially registered
 */
function isEnteredCodeValid(enteredCode, correctCode) {
  return correctCode === enteredCode;
}


/**
 * Function to activate the user in the database. This function is called with
 * the e-mail of the user once the verification code has been validated.
 * 
 * @param {String} email - the email of the user to activate
 */
async function activateUser(email) {
  const params = {
    TableName: 'Users',
    Key: { email },
    UpdateExpression: 'SET isVerified = :isVerifiedValue',
    ConditionExpression: 'attribute_exists(email)',
    ExpressionAttributeValues: {
      ':isVerifiedValue': true
    }
  };

  console.info(`Updating ${email} to be marked as active.`);
  try {
    await db.update(params).promise();
    return {
      message: 'Account confirmation complete!'
    };
  } catch (err) {
    console.error(err);
    return {
      error: 'There was a problem activating your account'
    };
  }
}


/**
 * Function to continue the registration workflow by sending a confirmation to the user 
 * that their account is successfully registered.
 * 
 * @param {String} emailTaskToken - the task token required to continue the registration workflow
 */
function sendConfirmationEmail(emailTaskToken) {
  stepfunctions.sendTaskSuccess({ verificationToken: emailTaskToken }).promise();
}