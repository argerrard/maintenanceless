import { isValidEmail } from "../../../libs/utils/stringUtilsLib";

test("testing with a valid e-mails", async () => {
  expect(isValidEmail("testemail@test.com")).toBe(true);
  expect(isValidEmail("test-email@test.com")).toBe(true);
  expect(isValidEmail("test_email123@helloworld.com")).toBe(true);
});

test("testing with an invalid e-mail with no @ sign", async () => {
  expect(isValidEmail("testemailtest.com")).toBe(false);
  expect(isValidEmail("test-email_test.com")).toBe(false);
});

test("testing with a valid e-mail with multiple dots", async () => {
  expect(isValidEmail("test.testuser@google.com")).toBe(true);
  expect(isValidEmail("hello.world.dot@hotmail.com")).toBe(true);
});

test("testing with an invalid e-mail with no dot after the @ sign", async () => {
  expect(isValidEmail("test.testuser@googlecom")).toBe(false);
  expect(isValidEmail("test.testuser@google_com")).toBe(false);
});

test("testing an invalid e-mail string with no @s or .s", async () => {
  expect(isValidEmail("testtestusergooglecom")).toBe(false);
});


