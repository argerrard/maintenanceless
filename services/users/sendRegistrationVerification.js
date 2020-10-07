var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-2' });
const ses = new AWS.SES();
var db = new AWS.DynamoDB.DocumentClient();

const params = {
  Destination: {
    /* User e-mail address to be appended here */
    ToAddresses: []
  },
  Message: {
    Body: {
      Text: {
        Charset: "UTF-8",
        Data: ""
      }
    },
    Subject: {
      Charset: "UTF-8",
      Data: "Thank you for registering with Maintenanceless!"
    }
  },
  Source: "maintenanceless@gmail.com"
};

exports.handler = async (event, context) => {
  const { email, confirmationCode, token } = event;
  // Set message body to include the confirmation code
  params.Message.Body.Text.Data = getEmailMessage(confirmationCode);
  params.Destination.ToAddresses.push(email);

  try {
    addTokenToDB(email, token);
    const result = await ses.sendEmail(params).promise();
    console.info(result);
  } catch(err) {
    console.error(err);
  }
};

/* Helper function to add the task token to the Users table.
 * This is required so that once the confirmation code is entered by the user,
 * we can then continue the step function workflow.
 */
async function addTokenToDB(email, token) {
  const params = {
    TableName: 'Users',
    Key: {
      email
    },
    UpdateExpression: "set verificationToken = :token",
    ExpressionAttributeValues: {
      ":token": token
    },
    ReturnValues: "UPDATED_NEW"
  };

  console.info(`Adding token ${token} to ${email}.`);
  try {
    const result = await db.update(params).promise();
    console.log('Token added to user:', token);
  } catch (err) {
    console.error(err);
    throw new Error(`Unable to update the token for ${email}.`);
  }
};

function getEmailMessage(confirmationCode) {
  return `Thank you for registering with Maintenanceless!\n\nYour confirmation code is: ${confirmationCode}.\n\n` +
          'Please enter this code into the application to confirm your registration. ' + 
          'If an account is not confirmed within 24 hours, you will have to re-register for the service.';
};
