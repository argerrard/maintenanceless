import { generateConfirmationCode, generatePasswordHash } from '../libs/userAuthLib';

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
    return 123456;
  }
}

export default User;