class EmailManager {
  constructor(emailService) {
    this.emailService = emailService;
  }

  async sendEmail(receipients, source, subject, body) {
    await this.emailService.sendEmail(receipients, source, subject, body);
  }
}

export default EmailManager;