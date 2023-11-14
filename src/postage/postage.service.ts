import { Injectable } from '@nestjs/common';
import * as FormData from 'form-data';
import Mailgun from 'mailgun.js';

import loggedIn from './emails/loggedIn';
import passwordChanged from './emails/passwordChanged';
import resetCode from './emails/resetCode';
import welcome from './emails/welcome';

import { PostageDto } from './postage.dto';
import logger from '../../utils/logger';

const mailgun = new Mailgun(FormData).client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
});

const insertDataIntoHtml = (html: string, data: string[]): string => {
  let newHtml = html;
  data.forEach((item, index) => {
    newHtml = newHtml.replace(`$$$-${index}`, item);
  });
  return newHtml;
};

@Injectable()
export class PostageService {
  sendEmail(dto: PostageDto): boolean {
    let rawHtml: string;
    let subjectLine: string;

    // loads the correct template and subject line based on the template name
    switch (dto.template) {
      case 'welcome':
        rawHtml = welcome;
        subjectLine = 'Welcome to Kreative!';
        break;
      case 'reset-code':
        rawHtml = resetCode;
        subjectLine = 'Password Reset Code | Kreative';
        break;
      case 'new-login':
        rawHtml = loggedIn;
        subjectLine = 'Did you just login? | Kreative';
        break;
      case 'password-changed':
        rawHtml = passwordChanged;
        subjectLine = 'Password Changed | Kreative';
        break;
      default:
        throw new Error('Invalid template name');
    }

    const newHtml = insertDataIntoHtml(rawHtml, dto.data);

    // mailgun data for the email to be sent
    const mailgunData = {
      from: dto.fromAddress || `"Kreative" <mailgun@mail.kreativeusa.com>`,
      replyTo: dto.replyTo || 'armaan@kreativeusa.com',
      to: dto.toAddress,
      subject: subjectLine,
      html: newHtml,
    };

    // sends an email using mailgun message API
    mailgun.messages
      .create('mail.kreativeusa.com', mailgunData)
      .then((response: any) => {
        logger.info({ message: 'new email sent', response });
        return true;
      })
      .catch((error: any) => {
        // handle any unknown error that comes up
        // we don't want to throw an exception because if sending an email doesn't work
        // the rest of the program should still continue to work
        logger.error({ message: 'new email send failed', error });
        return false;
      });

    return false;
  }
}
