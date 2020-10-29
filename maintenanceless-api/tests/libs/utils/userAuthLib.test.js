jest.mock("bcryptjs");

import bcrypt from "bcryptjs";
import { generateConfirmationCode, generatePasswordHash, isEnteredCodeValid } from "../../../libs/utils/userAuthLib";

/**
 * Tests for generateConfirmationCode
 * 
 */
test("testing that the generated code is 6 characters long", async () => {
  expect(generateConfirmationCode().length).toBe(6);
});

test("testing that the generated code is numeric", async () => {
  const isNumeric = (code) => !isNaN(code);
  expect(isNumeric(generateConfirmationCode())).toBe(true);
});

/**
 * Tests for generatePasswordHash
 * 
 */
test("bcrypt hash should be called with the password and hash rounds parameters", async () => {
  const result = generatePasswordHash('testpw', 10);
  expect(bcrypt.hash).toHaveBeenCalledTimes(1);
  expect(bcrypt.hash).toHaveBeenCalledWith('testpw', 10, expect.anything());
});

/**
 * Tests for isEnteredCodeValid
 * 
 */
test("testing that a matching code returns true", async () => {
  expect(isEnteredCodeValid("123456", "123456")).toBe(true);
});

test("testing that a non-matching code returns false", async () => {
  expect(isEnteredCodeValid("12345", "123456")).toBe(false);
  expect(isEnteredCodeValid("987654", "123456")).toBe(false);
});

test("checking the a number does not match the string code", async () => {
  expect(isEnteredCodeValid(123456, "123456")).toBe(false);
});