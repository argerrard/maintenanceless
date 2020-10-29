import SESAdapter from "../../../libs/aws/SESAdapter";

test("ensure SESAdapter structures the params correctly when sending an e-mail", async () => {
  const mockSendEmail = jest.fn();
  mockSendEmail.mockReturnValue({
    promise: jest.fn()
  });
  const mockSES = {
    sendEmail: mockSendEmail
  };
  const manager = new SESAdapter(mockSES);

  const expectedParams = {
    Destination: {
      ToAddresses: ["test@test.com"]
    },
    Message: {
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: "body"
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: "subject"
      }
    },
    Source: "test@test.com"
  };

  manager.sendEmail(["test@test.com"], "test@test.com", "subject", "body");
  expect(mockSendEmail).toHaveBeenCalledTimes(1);
  expect(mockSendEmail).toHaveBeenCalledWith(expectedParams);
});