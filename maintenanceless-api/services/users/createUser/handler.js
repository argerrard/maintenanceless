import handler from "../../../libs/aws/handlerLib";
import DynamoDBRepository from "../../../libs/aws/DynamoDBRepository";
import { isValidEmail } from "../../../libs/utils/stringUtilsLib";
import errors from "../../../libs/constants/errors";
import User from "../../../models/User";

import AWS from "aws-sdk";

const client = new AWS.DynamoDB.DocumentClient();
const repository = new DynamoDBRepository("Users", client);
const invalidRequestResponse = {
  statusCode: 400,
  body: {
    error: "E-mail and password are required to create a new user."
  }
};

export const main = handler(async (event, context) => {
  // Validate that there is an event body
  if (!event.body) {
    return invalidRequestResponse;
  }

  let { email, password } = JSON.parse(event.body);

  // Validate that email and password are both provided
  if (!email || !password) {
    return invalidRequestResponse;
  }

  // Confirm that email is in a valid format
  if (!isValidEmail(email)) {
    return {
      statusCode: 400,
      body: {
        error: "The e-mail provided was an invalid format."
      }
    };
  }

  // Lower case e-mail so that we don't have duplicate entries in our database
  email = email.toLowerCase();

  // Create the new user with the provided repository
  const userModel = new User(repository);
  const result = await userModel.createUser(email, password);

  if (result.error && result.errorKey === errors.KEY_EXISTS_EXCEPTION) {
    return {
      statusCode: 409,
      body: {
        error: "The e-mail provided is already registered."
      }
    };
  } else if (result.error) {
    return {
      statusCode: 500,
      body: {
        error: "There was a problem registering the account."
      }
    };
  }

  return {
    body: {
      result: "User successfully created."
    }
  };
});