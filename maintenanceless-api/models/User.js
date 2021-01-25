import { generateConfirmationCode, generatePasswordHash, isEnteredCodeValid } from '../libs/utils/userAuthLib';

class User {
  constructor(repository) {
    this.repository = repository;
  }

  async createUser(email, password) {
    if (!email || !password) {
      return {
        error: "An email and a password are required to create a user."
      };
    }

    // Generate the hash of the password to be used for the user
    let hashedPassword;
    try {
      hashedPassword = await generatePasswordHash(password, 10);
    } catch (err) {
      console.error(err);
      return {
        error: "There was a problem creating the user."
      };
    }

    const userData = {
      email,
      password: hashedPassword,
      confirmationCode: generateConfirmationCode(),
      isVerified: false
    };

    const options = { overwrite: false, primaryKeyField: "email" };
    const result = await this.repository.create(userData, options);

    if (result.error) {
      return {
        error: "There was a problem creating the user.",
        errorKey: result.error
      };
    }

    return {
      result: "User created successfully."
    };
  }

  async isUserVerified(email) {
    const options = { primaryKeyField: "email", attributesToGet: [ "isVerified" ] };
    try {
      const { error, result } = await this.repository.get(email, options);
      if (error || !result.hasOwnProperty("isVerified")) {
        console.error(error);
        return false;
      }
      return result.isVerified;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async getUserConfirmationCode(email) {
    const options = { primaryKeyField: "email", attributesToGet: [ "confirmationCode" ] };
    try {
      const { error, result } = await this.repository.get(email, options);
      if (error || !result.hasOwnProperty("confirmationCode")) {
        console.error(error);
        return {
          error: `Could not find a confirmation code for ${email}.`
        };
      }
      return result;
    } catch (err) {
      console.error(err);
      return {
        error: `Could not find a confirmation code for ${email}.`
      };
    }
  }

  async activateUser(email) {
    const updates = { isVerified: true };
    const options = { primaryKeyField: "email", updates };
    const { result, error } = await this.repository.update(email, options);

    if (error) {
      console.error(`There was a problem activating user: ${email}`);
      return {
        error: 'There was a problem activating the user.',
        errorKey: error
      };
    }

    return result;
  }

  async verifyUserRegistration(email, enteredConfirmationCode) {
    const ERROR_MESSAGE = 'There was a problem verifying the user with the provided confirmation code.';
    // Check to see if the user is already verified before continuing further
    const isVerified = await this.isUserVerified(email);
    if (isVerified) {
      console.error(`Verification failed for e-mail: ${email}. User is already verified.`);
      return {
        error: ERROR_MESSAGE
      };
    }

    // If the user is not already verified, get the correct confirmation code
    const { error, confirmationCode } = await this.getUserConfirmationCode(email);
    if (error) {
      console.error(error);
      return {
        error: ERROR_MESSAGE
      };
    }

    console.info(`Comparing entered code: ${enteredConfirmationCode} to actual ${confirmationCode}.`);
    // Compare the supplied confirmation code to the confirmation code in the repository
    const isCodeValid = isEnteredCodeValid(enteredConfirmationCode, confirmationCode);
    console.info(`Is code valid: ${isCodeValid}`);
    if (!isCodeValid) {
      return {
        error: 'The supplied confirmation code did not match with the confirmation code on file.'
      };
    }

    // Mark the user as active in the repository
    const activationResult = await this.activateUser(email);

    if (activationResult.error) {
      return {
        error: 'There was a problem activating the user in the system.'
      };
    }

    return {
      result: `Success! ${email} is activated and ready to start maintaining.`
    };
  }

  /**
   * Method to return the hashed password for the provided user.
   * The return value is an object with an error attribute containing the error message on failure.
   * On success, the return value is an object containing the hashed password with the password key.
   *
   * @param {String} email
   */
  async getHashedPassword(email) {
    const options = { primaryKeyField: "email", attributesToGet: [ "password" ] };
    const { result, error } = await this.repository.get(email, options);

    if (error || !result.hasOwnProperty("password")) {
      return {
        error: 'There was a problem getting the password from the repository.'
      };
    }

    return {
      password: result.password
    };
  }
}

export default User;