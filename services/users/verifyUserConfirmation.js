var AWS = require("aws-sdk");
var db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  const { email, confirmationCode, verificationToken } = event;
  // Get the confirmationCode stored in the database for the user
  // Verify that the supplied code matches the generated code
  // Trigger the step function to continue and activate the user
};
