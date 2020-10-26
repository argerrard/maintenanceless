import DynamoDBRepository from "../../../libs/DynamoDBRepository";
import User from "../../../models/User";

import AWS from "aws-sdk";

const client = new AWS.DynamoDB.DocumentClient();
const repository = new DynamoDBRepository("Users", client);
const userModel = new User(repository);

const invalidRequestResponse = {
  statusCode: 400,
  body: {
    error: "Bad request - an email and confirmation code are required."
  }
};

 /**
  * This handler is triggered by API Gateway when a POST request is made to
  * /verify with body parameters including an e-mail and a verification code.
  *
  */
 export const main = async (event, context) => {
  if (!event.body) {
    return invalidRequestResponse;
  }
  let { email, confirmationCode } = JSON.parse(event.body);

  if (!email || !confirmationCode) {
    return invalidRequestResponse;
  }

  email = email.toLowerCase();
  const isVerified = await userModel.isUserVerified(email);
  return isVerified;
};