import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

/**
 * Generates a confirmation code that the user is required to enter when registering.
 * Confirmation codes are a string of digits that is always six digits long.
 *
 */
export function generateConfirmationCode() {
  return Math.random().toString().split('.')[1].substring(0,6);
}

/**
 * Function that returns a promise containing the result of hashing the provided
 * password. The salt is auto-generated.
 *
 * @param {String} password the password to be hashed by bcrypt
 * @param {Number} hashRounds the number of hash rounds to use when hashing the password
 */
export function generatePasswordHash(password, hashRounds) {
  return new Promise((resolve, reject) => {
      bcrypt.hash(password, hashRounds, function(hashError, hashResult) {
      if (hashError) {
        console.error(hashError);
        reject('There was a problem creating the hash.');
      }
      return resolve(hashResult);
    });
  });
}

/**
 * Helper function to confirm that the code supplied by the user is valid.
 * Returns true if the verification code matches the database, false otherwise.
 *
 * @param {String} enteredCode - the code entered by the user
 * @param {String} correctCode - the code created when the user initially registered
 */
export function isEnteredCodeValid(enteredCode, correctCode) {
  return correctCode === enteredCode;
}

/**
 * Helper function to confirm if a user provided password is correct for logging in.
 * Returns true if the password matches the provided hash, false otherwise.
 *
 * @param {String} password - the password provided by the user
 * @param {String} passwordHash - the password hash stored in the repository
 */
export function isValidPassword(password, passwordHash) {
  try {
    return bcrypt.compareSync(password, passwordHash);
  } catch(err) {
    console.error(err);
    return false;
  }
}

export function generateJWT(jwtBody, jwtSecret, expiresIn = '6h') {
  const token = jwt.sign(jwtBody, jwtSecret, { expiresIn });
  return token;
}