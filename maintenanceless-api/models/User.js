import { generateConfirmationCode, generatePasswordHash, isEnteredCodeValid } from '../libs/userAuthLib';

class User {
  constructor(repository) {
    this.repository = repository;
  }

  async createUser(email, password) {
    // Generate the hash of the password to be used for the user
    let hashedPassword;
    try {
      hashedPassword = await generatePasswordHash(password, 10);
    } catch (err) {
      return {
        error: "There was a problem creating the user"
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
      result: "User created succesfully."
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

    // Compare the supplied confirmation code to the confirmation code in the repository
    const isCodeValid = isEnteredCodeValid(enteredConfirmationCode, confirmationCode);
    if (!isCodeValid) {
      return {
        error: 'The supplied confirmation code did not match with the confirmation code on file.'
      };
    }

    // TODO: Code entered was valid, mark the user as active in the app database
    
    return {
      result: `Success! ${email} is activated and ready to start maintaining.`
    };
  }
}

export default User;