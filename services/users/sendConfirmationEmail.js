var AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-2" });
const ses = new AWS.SES();

const EMAIL_MESSAGE =
  "You are now registered with Maintenanceless!\n\nGo ahead and start tracking your home maintenance tasks. Happy maintaining!\n\n";

const params = {
  Destination: {
    /* User e-mail address to be appended here */
    ToAddresses: []
  },
  Message: {
    Body: {
      Text: {
        Charset: "UTF-8",
        Data: EMAIL_MESSAGE
      }
    },
    Subject: {
      Charset: "UTF-8",
      Data: "You are now confirmed with Maintenanceless!"
    }
  },
  Source: "maintenanceless@gmail.com"
};

exports.handler = async (event, context) => {
  const { email } = event;
  params.Destination.ToAddresses.push(email);
  try {
    const result = await ses.sendEmail(params).promise();
    console.info(result);
  } catch (err) {
    console.error(err);
  }
};
