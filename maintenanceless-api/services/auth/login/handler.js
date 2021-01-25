import handler from "../../../libs/aws/handlerLib";
import { isValidEmail } from "../../../libs/utils/stringUtilsLib";
import { isValidPassword, generateJWT } from "../../../libs/utils/userAuthLib";
import DynamoDBRepository from "../../../libs/aws/DynamoDBRepository";
import User from "../../../models/User";

import AWS from "aws-sdk";

const client = new AWS.DynamoDB.DocumentClient();
const repository = new DynamoDBRepository("Users", client);
const JWT_SECRET = process.env.JWT_SECRET;

const invalidRequestResponse = {
  statusCode: 400,
  body: {
    error: "E-mail and password are required to log in."
  }
};

const loginErrorResponse = {
  statusCode: 401,
  body: {
    error: 'There was a problem logging in - please check your e-mail and password.'
  }
};

/**
 * This route is used for a registered user to login into the app.
 * The user logs in via POST request to /auth/login with email and password body params.
 *
 */
export const main = handler(async (event, context) => {
  console.info('event');
  console.info(event);
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

  // If we get here we have a valid email and a password in the request
  // Get the hashed password from DynamoDB for the user (if they exist and are verified)
  const userModel = new User(repository);

  // Ensure that the user is verified
  const isUserVerified = await userModel.isUserVerified(email);
  if (!isUserVerified) {
    return loginErrorResponse;
  }

  // Use bcrypt to verify if the hashed password matches the provided password
  const result = await userModel.getHashedPassword(email);
  if (result.error) {
    return {
      statusCode: 500,
      body: {
        error: "There was a problem logging you in."
      }
    };
  }

  // We have found the hashed password, confirm that it is valid
  const hashedPassword = result.password;
  const isLoginSuccess = isValidPassword(password, hashedPassword);

  // If the passwords do not match, return an error
  if (!isLoginSuccess) {
    return loginErrorResponse;
  }

  // If the passwords do match, return a signed JWT
  const token = generateJWT({ email }, JWT_SECRET);

  return {
    body: {
      token
    }
  };
});
