import Nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const SendMail = async (option: EmailOptions): Promise<void> => {
  const transporter: Transporter = Nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  const { email, subject, template, data } = option;

  // get the path to the email template file
  const templatePath = path.join(__dirname, "../mails", template);

  //   Render the email template with ejs
  const html: string = await ejs.renderFile(templatePath, data);

  const mailOption = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html,
  };
  await transporter.sendMail(mailOption);
};

export default SendMail;
