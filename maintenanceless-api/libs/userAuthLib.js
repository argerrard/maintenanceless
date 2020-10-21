import bcrypt from "bcryptjs";

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