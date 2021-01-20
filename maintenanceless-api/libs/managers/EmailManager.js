class EmailManager {
  constructor(emailService) {
    this.emailService = emailService;
  }

  /**
   * Sends an e-mail to the specified receipents using the subject and body
   * passed into the method. The sender of the email is specified by the source.
   *
   * The service used to send the e-mail is specified in the constructor of the class.
   *
   * @param {[String]} receipients - Array of receipts to send the e-mails to
   * @param {String} source - The sender of the e-mail
   * @param {String} subject - The subject of the email
   * @param {String} body - The body of the email
   */
  async sendEmail(receipients, source, subject, body) {
    await this.emailService.sendEmail(receipients, source, subject, body);
  }
}

export default EmailManager;