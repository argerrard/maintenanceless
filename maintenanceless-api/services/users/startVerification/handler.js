import { DYNAMO_DB_INSERT } from "../../../libs/constants";
import SESAdapter from "../../../libs/SESAdapter";
import EmailManager from "../../../libs/EmailManager";

var AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-2" });
const ses = new AWS.SES();
const sesAdapter = new SESAdapter(ses);
const emailManager = new EmailManager(sesAdapter);
const emailSource = "maintenanceless@gmail.com";
const emailTitle = "Thank you for registering with Maintenanceless!";

 /**
  * This handler is triggered by DynamoDB Streams on our User Table.
  * When a new user is added, we want to trigger an SES e-mail to the user
  * with their verification code included.
  *
  */
 export const main = async (event, context) => {
   console.info("Processing Event: ");
   console.info(JSON.stringify(event));
   const { Records } = event;
   for (const record of Records) {
    // We only want to process new User events, nothing else
    if (record.eventName === DYNAMO_DB_INSERT) {
      const email = getAttribute(record, "email", "S");
      const confirmationCode = getAttribute(record, "confirmationCode", "S");
      console.info(`Sending email to ${email} with confirmation code of ${confirmationCode}`);
      await emailManager.sendEmail([email], emailSource, emailTitle, getEmailMessage(confirmationCode));
    }
   }
};

function getAttribute(record, attribute, type) {
  return record.dynamodb.NewImage[attribute][type];
}

function getEmailMessage(confirmationCode) {
  return `Thank you for registering with Maintenanceless!\n\nYour confirmation code is: ${confirmationCode}.\n\n` +
          'Please enter this code into the application to confirm your registration.';
};
