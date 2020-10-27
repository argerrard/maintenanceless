import EmailManager from "../../../libs/managers/EmailManager";

test("ensure that the e-mail manager calls the adapter with the right params", async () => {
  const mockSendEmail = jest.fn();
  const mockEmailAdapter = {
    sendEmail: mockSendEmail
  };
  const manager = new EmailManager(mockEmailAdapter);
  manager.sendEmail(["test@test.com"], "test@test.com", "subject", "body");
  expect(mockSendEmail).toHaveBeenCalledTimes(1);
  expect(mockSendEmail).toHaveBeenCalledWith(["test@test.com"], "test@test.com", "subject", "body");
});