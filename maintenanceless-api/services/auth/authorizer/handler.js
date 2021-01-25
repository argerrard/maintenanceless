import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const UNAUTHORIZED = "Unauthorized";

/**
 * Initial implementation of lambda authorizer. If the token is valid, access is automatically allowed.
 * The restrictions on this authorizer can tighten once more endpoints are created.
 *
 */
export const main = async ({ authorizationToken, methodArn }, context) => {
  const token = authorizationToken.split('Bearer ')[1];
  console.info(`Request made for ${methodArn} with token ${token}`);

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    console.error(e);
    throw new Error(UNAUTHORIZED);
  }

  console.info('Request was successful with token: decodedToken', decodedToken);

  const policy = generatePolicy(decodedToken.email, 'Allow', methodArn, decodedToken);
  console.info('Generated policy: ', policy);

  return policy;
};


const generatePolicy = function(principalId, effect, resource, token) {
  const authResponse = {};

  authResponse.principalId = principalId;
  if (effect && resource) {
    var policyDocument = {};
    policyDocument.Version = "2012-10-17";
    policyDocument.Statement = [];
    var statementOne = {};
    statementOne.Action = "execute-api:Invoke";
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }

  authResponse.context = {
    email: token.email
  };

  return authResponse;
};