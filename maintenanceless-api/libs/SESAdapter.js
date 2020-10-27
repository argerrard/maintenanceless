class SESAdapter {
  constructor(ses) {
    this.ses = ses;
  }

  async sendEmail(receipients, source, subject, body) {
    const params = {
      Destination: {
        /* User e-mail address to be appended here */
        ToAddresses: receipients
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: body
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject
        }
      },
      Source: source
    };

    try {
      const result = await this.ses.sendEmail(params).promise();
      console.info(result);
    } catch (err) {
      console.error(err);
    }
  }
}

export default SESAdapter;