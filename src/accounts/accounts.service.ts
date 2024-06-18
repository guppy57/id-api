import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import * as argon2 from 'argon2';
import { Account, Keychain, RolesOnAccounts } from '@prisma/client';
import {
  SigninDto,
  SignupDto,
  UpdateAccountDto,
  UpdateWalletBalanceDto,
  VerifyCodeDto,
  ResetPasswordDto,
  SendCodeDto,
  UpdateAvatarDto,
} from './accounts.dto';
import { IResponse } from '../../types/IResponse';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaErrors } from '../../utils/handlePrismaErrors';
import { KeychainsService } from '../keychains/keychains.service';
import { PostageService } from '../postage/postage.service';
import { PhotosService } from '../photos/photos.service';
import { ApplicationsService } from '../applications/applications.service';
import { RolesService } from '../roles/roles.service';
import { KeychainDto } from '../keychains/keychains.dto';
import { PostageDto } from '../postage/postage.dto';
import logger from '../../utils/logger';
import { IAuthenticatedRequest } from '../../types/IAuthenticatedRequest';
import analytics from '../../utils/segment';
import { getPrismaStyleDateTime } from '../../utils/prismaDate';
@Injectable({})
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  @Inject(PostageService)
  private readonly postage: PostageService;

  @Inject(KeychainsService)
  private readonly keychains: KeychainsService;

  @Inject(PhotosService)
  private readonly photos: PhotosService;

  @Inject(ApplicationsService)
  private readonly applications: ApplicationsService;

  @Inject(RolesService)
  private readonly roles: RolesService;

  // creates a new, unique kreative service number
  async generateKSN(): Promise<number> {
    let unique = false;
    let newKSN = 0;
    // create new 'nanoid' function with custom parameters
    const nanoid = customAlphabet('123456789', 8);
    // loop to create a completely unique ksn
    while (!unique) {
      // create new random ksn from function
      newKSN = parseInt(nanoid() as string);
      // check if the ksn exists in the database
      logger.info('prisma.account.findUnique in generateKSN initiated');
      const account = await this.prisma.account.findUnique({
        where: { ksn: newKSN },
      });
      if (account === null) unique = true;
    }

    logger.info(`new ksn generated: ${newKSN}`);
    return newKSN;
  }

  // updates the wallet balance for the account
  async updateWalletBalance(dto: UpdateWalletBalanceDto): Promise<number> {
    let walletBalance: number;
    let account: Account;

    try {
      // retrieves the current account with ksn
      logger.info('prisma.account.findUnique in update balance initiated');
      account = await this.prisma.account.findUnique({
        where: { ksn: dto.ksn },
      });
    } catch (error) {
      // handles any prisma errors
      logger.error({ message: 'prisma.account.findUnique failed', error });
      handlePrismaErrors(error);
    }

    // sets the current accounts balance
    walletBalance = account.walletBalance;
    // updates the walletBalance amount
    const change = dto.type === 'debit' ? dto.amount : dto.amount * -1;
    walletBalance -= change;

    try {
      // updates the balance in the account
      // we don't store the change returned because we don't use it
      logger.info(
        `prisma.account.update initiated in update balance with ksn: ${dto.ksn}`,
      );
      await this.prisma.account.update({
        where: { ksn: dto.ksn },
        data: { walletBalance },
      });
    } catch (error) {
      // handles any prisma errors
      logger.error({
        message: `prisma.account.update in update balance with ksn: ${dto.ksn}`,
        error,
      });
      handlePrismaErrors(error);
    }

    logger.info(`wallet balance updated to ${walletBalance} for ${dto.ksn}`);
    return walletBalance;
  }

  async verifyCode(code: number, type: string, ksn: number): Promise<boolean> {
    logger.info(
      `verifyCode initiated with code: ${code} and type: ${type} for ksn: ${ksn}`,
    );
    let account: Account;

    try {
      // retrieves the current account with ksn
      logger.info('prisma.account.findUnique in verifyCode initiated');
      account = await this.prisma.account.findUnique({
        where: { ksn },
      });
    } catch (error) {
      // handles any prisma errors
      logger.error({ message: 'prisma.account.findUnique failed', error });
      handlePrismaErrors(error);
    }

    if (type === 'verifyCode') {
      if (account.verifyCode === code) return true;
      else return false;
    } else if (type === 'resetCode') {
      if (account.resetCode === code) return true;
      else return false;
    } else {
      logger.error(
        `invalid type of ${type} in verifyCode, throwing InternalServerError`,
      );
      throw new InternalServerErrorException('verifyCode type not valid');
    }
  }

  // creates a new user account and keychain
  async signup(dto: SignupDto): Promise<IResponse> {
    let account: Account;
    // create custom generate ksn
    const ksn: number = await this.generateKSN();
    // generate the hashed password
    const bpassword: string = await argon2.hash(dto.password);
    logger.info('new account password salted');

    // add the appropriate profile picture for the user
    const firstLetter = dto.firstName.charAt(0).toUpperCase();
    const photoUrl = `https://cdn.kreativeusa.com/kreative_id/letter_avatars/${firstLetter}.png`;

    const baseRole = await this.applications.getBaseRole(dto.aidn);

    let firstName: string;
    let lastName: string;

    // check if first name and last name are properly capitalized
    // if not, we capitalize them
    if (
      dto.firstName.charAt(0) === dto.firstName.charAt(0).toUpperCase() &&
      dto.firstName.charAt(1) === dto.firstName.charAt(1).toLowerCase()
    ) {
      firstName = dto.firstName;
    } else {
      firstName =
        dto.firstName.charAt(0).toUpperCase() +
        dto.firstName.slice(1).toLowerCase();
    }

    if (
      dto.lastName.charAt(0) === dto.lastName.charAt(0).toUpperCase() &&
      dto.lastName.charAt(1) === dto.lastName.charAt(1).toLowerCase()
    ) {
      lastName = dto.lastName;
    } else {
      lastName =
        dto.lastName.charAt(0).toUpperCase() +
        dto.lastName.slice(1).toLowerCase();
    }

    try {
      // create the new user in prisma
      logger.info(`prisma.account.create initiated with ${dto.email}`);
      account = await this.prisma.account.create({
        data: {
          profilePicture: photoUrl,
          email: dto.email.toLowerCase(),
          firstName: firstName,
          lastName: lastName,
          username: dto.username.toLowerCase(),
          bpassword,
          ksn,
        },
      });
    } catch (error) {
      // handles any prisma errors that come up
      logger.error({
        message: `prisma.account.create for ${dto.email} failed`,
        error,
      });
      handlePrismaErrors(error);
    }

    // adds the base permission to the account
    const roles = ['KREATIVE_ID_USER', baseRole];
    await this.roles.addRolesForUser(ksn, roles);

    // removes sensitive information from account object
    delete account.bpassword;
    delete account.resetCode;
    logger.info(`sensitive info for new account with ${dto.email} removed`);

    // sets up data for new Keychain with the keychain dto
    const keychainData: KeychainDto = {
      ksn,
      aidn: dto.aidn,
      rememberMe: true,
      environment: dto.environment,
    };

    // creates a new keychain for the newly created account with keychain data
    logger.info(`createKeychain in signup initiated with ${dto.email}`);
    const keychain: Keychain = await this.keychains.createKeychain(
      keychainData,
    );

    // adds a new photo for the user with the photos API that matches their profile picture
    await this.photos.uploadPhotoFromUrl(
      ksn,
      photoUrl,
      'avatar',
      `${firstLetter}.png`,
    );

    // creates the data for the new welcome email
    const welcomeEmailData: PostageDto = {
      toAddress: dto.email,
      template: 'welcome',
      data: [dto.firstName],
    };

    // sends welcome email through PostageModule
    logger.info({
      message: `new welcome email initiated in signup for ${dto.email}`,
      postageDto: welcomeEmailData,
    });
    this.postage.sendEmail(welcomeEmailData);

    // send back positive response, account object, and key
    const payload: IResponse = {
      statusCode: 200,
      message: 'Account created',
      data: { account, keychain },
    };

    logger.info({
      message: `signup succeeded for ${dto.email} + keychain id: ${keychain.id}`,
      payload,
    });

    analytics.identify({
      userId: ksn.toString(),
      traits: {
        username: account.username,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        roles: roles,
        avatar: account.profilePicture,
        createdAt: account.createdAt,
      },
    });

    analytics.track({
      userId: ksn.toString(),
      event: 'account_created',
      properties: {
        email: account.email,
        aidn: dto.aidn,
      },
    });

    return payload;
  }

  // creates a new keychain after authentication
  async signin(dto: SigninDto): Promise<IResponse> {
    let account: any;
    let passwordsMatch: boolean;

    try {
      // finds the account in the database based on unique email
      logger.info(
        `prisma.account.findUniqueOrThrow initiated for ${dto.email}`,
      );
      account = await this.prisma.account.findUniqueOrThrow({
        where: { email: dto.email.toLowerCase() },
        include: {
          roles: true,
        },
      });
    } catch (error) {
      // handle any other prisma errors that occur
      logger.error({
        message: `prisma.account.findUniqueOrThrow error: ${error} for ${dto.email}`,
        error,
      });
      handlePrismaErrors(error, 'No account found');
    }

    try {
      // check if password given matches password on file
      logger.debug(`password matching for ${dto.email} with argon2 initiating`);
      passwordsMatch = await argon2.verify(account.bpassword, dto.password);
    } catch (error) {
      // internal failure
      logger.error({ message: 'argon2.verify failed', error });
      throw new InternalServerErrorException();
    }

    // throw 401 error since passwords do not match
    if (!passwordsMatch) {
      logger.info(`password mismatch for ${dto.email}`);
      throw new UnauthorizedException('password mismatch');
    }

    delete account.bpassword;
    delete account.resetCode;
    logger.info(`removed sensitive account info for ${dto.email}`);

    // update user roles if needed
    const baseRole = await this.applications.getBaseRole(dto.aidn);
    await this.roles.addRolesForUser(account.ksn, [baseRole]);

    const keychainData: KeychainDto = {
      ksn: account.ksn,
      aidn: dto.aidn,
      rememberMe: dto.rememberMe,
      environment: dto.environment,
    };

    // creates a new keychain for the newly created account with keychain data
    logger.info(`createKeychain in signin initiated with ${dto.email}`);
    const keychain: Keychain = await this.keychains.createKeychain(
      keychainData,
    );

    // creates the data for the login notification email
    const loginEmailData: PostageDto = {
      toAddress: dto.email,
      template: 'new-login',
      data: [account.firstName],
    };

    // sends welcome email through PostageModule
    logger.info({
      message: `new login email initiated in signin for ${dto.email}`,
      postageDto: loginEmailData,
    });

    this.postage.sendEmail(loginEmailData);

    // send all necessary data back to the client
    const payload: IResponse = {
      statusCode: 200,
      message: 'Account logged in',
      data: { account, keychain },
    };

    analytics.identify({
      userId: account.ksn.toString(),
      traits: {
        username: account.username,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        roles: account.roles.map((role: RolesOnAccounts) => role.rid),
        avatar: account.profilePicture,
        updatedAt: account.updatedAt,
      },
    });

    analytics.track({
      userId: account.ksn.toString(),
      event: 'account_signed_in',
      properties: {
        email: account.email,
        aidn: dto.aidn,
      },
    });

    logger.info({ message: `signin for ${dto.email} succeeded`, payload });
    return payload;
  }

  // updates basic data for an account, does not touch permissions
  // this method needs be changed for the way it handles passwords, since all we have in the db
  // is the salted password, if they don't send a new password, it will be salting something undefined
  // create a conditional that if no password is sent, the password will stay the same
  async updateAccount(
    req: IAuthenticatedRequest,
    dto: UpdateAccountDto,
  ): Promise<IResponse> {
    let account: any;
    let tempAccount: Account;

    // first we check if the username is available
    try {
      // finds the account in the database based on unique email
      logger.info(`prisma.account.findUnique initiated for ${dto.username}`);
      tempAccount = await this.prisma.account.findUnique({
        where: { username: dto.username },
      });
    } catch (error) {
      // handle any other prisma errors that occur
      logger.error({
        message: `prisma.account.findUnique error: ${error} for ${dto.username}`,
        error,
      });
      handlePrismaErrors(error);
    }

    // if the username is taken, and it is not the same as the current account
    // we throw a conflict exception
    if (tempAccount && tempAccount.ksn !== req.kreativeAccount.ksn) {
      logger.info(
        `username ${dto.username} is already taken for ${req.kreativeAccount.email}`,
      );
      // since there is a conflict we throw this exception with a status code of 409
      throw new ConflictException('username is already taken');
    }

    // second, we check if the email is available
    try {
      // finds the account in the database based on unique email
      logger.info(`prisma.account.findUnique initiated for ${dto.email}`);
      tempAccount = await this.prisma.account.findUnique({
        where: { email: dto.email },
      });
    } catch (error) {
      // handle any other prisma errors that occur
      logger.error({
        message: `prisma.account.findUnique error: ${error} for ${dto.email}`,
        error,
      });
      handlePrismaErrors(error);
    }

    if (tempAccount && tempAccount.ksn !== req.kreativeAccount.ksn) {
      logger.info(
        `email ${dto.email} is already taken for ${req.kreativeAccount.email}`,
      );
      // since there is a conflict we throw this exception with a status code of 409
      throw new ConflictException('email is already taken');
    }

    // create the update data object
    const updateData: any = {
      email: dto.email,
      username: dto.username,
      firstName: dto.firstName,
      lastName: dto.lastName,
      profilePicture: dto.profilePicture,
    };

    // if the client sends a new password, then we salt and add it to the updateData object
    if (dto.password) {
      const bpassword: string = await argon2.hash(dto.password);
      logger.info(`password salted in updateAccount`);
      updateData.bpassword = bpassword;
    }

    try {
      // update account details and returns update
      logger.info('prisma.account.update initiated in updateAccount');
      account = await this.prisma.account.update({
        where: {
          ksn: req.kreativeAccount.ksn,
        },
        data: updateData,
      });
    } catch (error) {
      // handles any prisma errors
      logger.error({
        message: 'prisma.account.update in updateAccount',
        error,
      });
      handlePrismaErrors(error);
    }

    // delete sensitive information from account object
    delete account.bpassword;
    delete account.resetCode;
    logger.info('sensitive information deleted from account object');

    // send all necessary data back to the client
    const payload: IResponse = {
      statusCode: 200,
      message: 'Account updated',
      data: { account },
    };

    analytics.identify({
      userId: account.ksn.toString(),
      traits: {
        username: account.username,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        roles: account.roles.map((role: RolesOnAccounts) => role.rid),
        avatar: account.profilePicture,
        updatedAt: account.updatedAt,
      },
    });

    analytics.track({
      userId: account.ksn.toString(),
      event: 'account_updated',
      properties: {
        email: account.email,
      },
    });

    logger.info({ message: 'updateAccount succeeded', payload });
    return payload;
  }

  // changes the profilePicture of an account using a new photoUrl
  async updateAvatar(
    req: IAuthenticatedRequest,
    dto: UpdateAvatarDto,
  ): Promise<IResponse> {
    let account: any;

    if (dto.photoUrl.substring(0, 8) !== 'https://') {
      logger.error(
        `photoUrl ${dto.photoUrl} is not a valid url for ${req.kreativeAccount.email}`,
      );
      throw new BadRequestException('photoUrl is not a valid url');
    }

    try {
      // update account details and returns update
      logger.info('prisma.account.update initiated in updateAvatar');
      account = await this.prisma.account.update({
        where: {
          ksn: req.kreativeAccount.ksn,
        },
        data: {
          profilePicture: dto.photoUrl,
        },
      });
    } catch (error) {
      // handles any prisma errors
      logger.error({
        message: 'prisma.account.update in updateAvatar',
        error,
      });
      handlePrismaErrors(error);
    }

    logger.info('sensitive information deleted from account object');

    // send all necessary data back to the client
    const payload: IResponse = {
      statusCode: 200,
      message: 'Account avatar updated',
      data: { profilePicture: account.profilePicture },
    };

    logger.info({ message: 'updateAvatar succeeded', payload });
    return payload;
  }

  // gets all non-sensitive info for one account
  async getAccount(req: IAuthenticatedRequest): Promise<IResponse> {
    let account: Account;
    const ksn = req.kreativeAccount.ksn;

    try {
      logger.info(
        `prisma.account.findUnique for ${ksn} in getAccount initiated`,
      );
      account = await this.prisma.account.findUnique({
        where: { ksn },
        include: {
          roles: true,
        },
      });
    } catch (error) {
      // handles prisma errors
      logger.error({
        message: `prisma.account.findUnique for ${ksn} in getAccount failed`,
        error,
      });
      handlePrismaErrors(error);
    }

    if (account === null || account === undefined) {
      // this error should only be thrown in development as in production
      // only valid and open ksn's should be sent
      logger.warn(`getAccount not finding an account for ${ksn}`);
      throw new NotFoundException('Account not found');
    } else {
      // removes sensitive information
      delete account.bpassword;
      delete account.resetCode;
      delete account.verifyCode;
      logger.info(`sensitive info for ${ksn} removed`);

      // returns account details
      const payload: IResponse = {
        statusCode: 200,
        message: 'Account found',
        data: account,
      };

      analytics.track({
        userId: account.ksn.toString(),
        event: 'account_updated_avatar',
        properties: {
          email: account.email,
          avatar: account.profilePicture,
        },
      });

      logger.info({ message: `getAccount for ${ksn} succeeded`, payload });
      return payload;
    }
  }

  async getAccountByEmail(email: string): Promise<IResponse> {
    let account: Account | undefined;

    try {
      logger.info(
        `prisma.account.findFirst for ${email} in getAccountByEmail initiated`,
      );
      account = await this.prisma.account.findFirst({
        where: {
          email,
        },
      });
    } catch (error) {
      logger.error({
        message: `prisma.account.findFirst for ${email} in getAccountByEmail failed`,
        error,
      });
      handlePrismaErrors(error);
    }

    const payload: IResponse = {
      statusCode: 200,
      message: 'Get account by email passed',
      data: {},
    };

    if (account === null || account === undefined) {
      payload.data = null;
    } else {
      delete account.bpassword;
      delete account.resetCode;
      delete account.verifyCode;
      payload.data = account;
    }

    logger.info({
      message: `getAccountForEmail for ${email} succeeded`,
      payload,
    });

    return payload;
  }

  async getAccountList(ksnList: number[]): Promise<IResponse> {
    let accounts: Account[];

    try {
      logger.info(
        `prisma.account.findMany for ${ksnList} in getAccountList initiated`,
      );
      accounts = await this.prisma.account.findMany({
        where: {
          ksn: {
            in: ksnList,
          },
        },
        include: {
          roles: true,
        },
      });
    } catch (error) {
      // handles prisma errors
      logger.error({
        message: `prisma.account.findMany for ${ksnList} in getAccountList failed`,
        error,
      });
      handlePrismaErrors(error);
    }

    if (accounts === null || accounts === undefined) {
      // this error should only be thrown in development as in production
      // only valid and open ksn's should be sent
      logger.warn(`getAccountList not finding an account for ${ksnList}`);
      throw new NotFoundException('Account not found');
    } else {
      // removes sensitive information
      accounts.forEach((account) => {
        delete account.bpassword;
        delete account.resetCode;
        delete account.verifyCode;
      });
      logger.info(`sensitive info for ${ksnList} removed`);

      // returns account details
      const payload: IResponse = {
        statusCode: 200,
        message: 'Account found',
        data: accounts,
      };

      logger.info({
        message: `getAccountList for ${ksnList} succeeded`,
        payload,
      });
      return payload;
    }
  }

  // creates a new reset code for the account and sends it
  async sendResetCode(dto: SendCodeDto): Promise<IResponse> {
    let accountChange: any;

    // generates a new reset code as integer
    const nanoid = customAlphabet('1234567890', 6);
    const resetCode: number = parseInt(nanoid() as string);
    logger.info(`new resetCode created: ${resetCode} for ${dto.email}`);

    try {
      // adds the resetCode to the account
      logger.info(
        `prisma.account.update in sendResetCode initiated for ${dto.email}`,
      );
      accountChange = await this.prisma.account.update({
        where: { email: dto.email },
        data: { resetCode },
      });
    } catch (error) {
      // handles any prisma errors
      logger.error({
        message: `prisma.account.update in sendResetCode for ${dto.email} failed`,
        error,
      });
      handlePrismaErrors(error);
    }

    // creates the data for the login notification email
    const codeEmailData: PostageDto = {
      toAddress: accountChange.email,
      template: 'reset-code',
      data: [accountChange.firstName, resetCode.toString()],
    };

    // sends welcome email through PostageModule
    logger.info(`new reset code email initiated in signin for ${dto.email}`);
    this.postage.sendEmail(codeEmailData);

    // sends resetCode and accountChange
    const payload: IResponse = {
      statusCode: 200,
      message: 'Reset code created',
      data: {
        ksn: accountChange.ksn,
      },
    };

    logger.info({
      message: `sendResetCode for ${dto.email} succeeded`,
      payload,
      accountChange,
    });
    return payload;
  }

  // verifies the resetCode for the designated account
  async verifyResetCode(ksn: number, dto: VerifyCodeDto): Promise<IResponse> {
    let accountChange: any;

    const isCorrect: boolean = await this.verifyCode(
      dto.code,
      'resetCode',
      ksn,
    );

    // checks for resetCode match
    if (!isCorrect) {
      logger.info(
        `resetCode mismatch for ${ksn}, UnauthorizedException thrown`,
      );
      throw new UnauthorizedException('resetCode mismatch');
    }

    // returns accountChange data
    const payload: IResponse = {
      statusCode: 200,
      message: 'resetCode verified',
    };

    logger.info({
      message: `verifyResetCode for ${ksn} succeeded`,
      payload,
      accountChange,
    });
    return payload;
  }

  async resetPassword(ksn: number, dto: ResetPasswordDto): Promise<IResponse> {
    let accountChange: any;

    // create salted password for update
    const bpassword: string = await argon2.hash(dto.password);
    logger.info('password salted in resetPassword');

    const isCorrect: boolean = await this.verifyCode(
      dto.resetCode,
      'resetCode',
      ksn,
    );

    if (!isCorrect) {
      logger.info(
        `resetCode mismatch for ${ksn}, UnauthorizedException thrown`,
      );
      throw new UnauthorizedException('resetCode mismatch');
    }

    try {
      // update the password for the account
      logger.info(
        `prisma.account.update in resetPassword for ${ksn} initiated`,
      );
      accountChange = await this.prisma.account.update({
        where: { ksn },
        data: { bpassword, resetCode: 0 },
      });
    } catch (error) {
      // handle any prisma errors
      logger.info({
        message: `prisma.account.update in resetPassword for ${ksn} failed`,
        error,
      });
      handlePrismaErrors(error);
    }

    // creates the data for the password reset notification email
    const passwordNotificationEmail: PostageDto = {
      toAddress: accountChange.email,
      template: 'password-changed',
      data: [accountChange.firstName],
    };

    // sends welcome email through PostageModule
    logger.info(`password changed email initiated for ${accountChange.email}`);
    this.postage.sendEmail(passwordNotificationEmail);

    // sends back account change and successful response
    const payload: IResponse = {
      statusCode: 200,
      message: 'Password updated',
    };

    analytics.track({
      userId: ksn.toString(),
      event: 'account_reset_password',
      properties: {
        email: accountChange.email,
      },
    });

    logger.info({
      message: `resetPassword for ${ksn} succeeded`,
      payload,
      accountChange,
    });
    return payload;
  }

  // creates a new reset code for the account and sends it
  async sendEmailVerificationCode(email: string): Promise<IResponse> {
    let accountChange: any;

    // generates a new verify code as integer
    const nanoid = customAlphabet('1234567890', 6);
    const verifyCode: number = parseInt(nanoid() as string);
    logger.info(`new verifyCode created: ${verifyCode} for ${email}`);

    try {
      // adds the verifyCode to the account
      logger.info(
        `prisma.account.update in sendEmailVerificationCode initiated for ${email}`,
      );
      accountChange = await this.prisma.account.update({
        where: { email },
        data: { verifyCode },
      });
    } catch (error) {
      // handles any prisma errors
      logger.error({
        message: `prisma.account.update in sendEmailVerificationCode for ${email} failed`,
        error,
      });
      handlePrismaErrors(error);
    }

    // creates the data for the login notification email
    const codeEmailData: PostageDto = {
      toAddress: accountChange.email,
      template: 'verify-code',
      data: [accountChange.firstName, verifyCode.toString()],
    };

    // sends welcome email through PostageModule
    logger.info(
      `new verification code email initiated in sendEmailVerificationCode for ${email}`,
    );
    this.postage.sendEmail(codeEmailData);

    // sends resetCode and accountChange
    const payload: IResponse = {
      statusCode: 200,
      message: 'Reset code created and sent',
      data: {
        ksn: accountChange.ksn,
      },
    };

    logger.info({
      message: `sendEmailVerificationCode for ${email} succeeded`,
      payload,
    });
    return payload;
  }

  // verifies the resetCode for the designated account
  async verifyEmailVerificationCode(
    ksn: number,
    code: number,
  ): Promise<IResponse> {
    logger.info(
      `verifyEmailVerificationCode for ${ksn} initiated with code ${code}`,
    );
    let accountChange: any;

    // checks for verifyCode match
    const isCorrect: boolean = await this.verifyCode(code, 'verifyCode', ksn);

    if (!isCorrect) {
      logger.info(
        `verifyCode mismatch for ${ksn}, UnauthorizedException thrown`,
      );
      throw new UnauthorizedException('verifyCode mismatch');
    }

    try {
      // removes the verifyCode from the account
      logger.info(
        `prisma.account.update in verifyEmailVerificationCode for ${ksn} initiated`,
      );
      accountChange = await this.prisma.account.update({
        where: { ksn },
        data: { verifyCode: 0, emailVerified: true },
      });
    } catch (error) {
      // handles any prisma error
      logger.info({
        message: `prisma.account.update in verifyEmailVerificationCode for ${ksn} failed`,
        error,
      });
      handlePrismaErrors(error);
    }

    // returns accountChange data
    const payload: IResponse = {
      statusCode: 200,
      message: 'verifyCode passes',
    };

    logger.info({
      message: `verifyEmailVerificationCode for ${ksn} succeeded`,
      payload,
      accountChange,
    });
    return payload;
  }

  async updatePrefix(
    ksn: number,
    prefix: string,
    aidn: number,
  ): Promise<IResponse> {
    logger.info(`updatePrefix for ${ksn} initiated with prefix ${prefix}`);
    let accountChange: any;

    const validPrefixes = [
      'Mr.',
      'Mrs.',
      'Ms.',
      'Dr.',
      'Rev.',
      'Sir',
      'Miss',
      '',
    ];

    // check if the prefix is valid
    if (!validPrefixes.includes(prefix)) {
      logger.error(
        `prefix ${prefix} is not a valid prefix for ${ksn}, BadRequestException thrown`,
      );
      throw new BadRequestException('prefix is not valid');
    }

    try {
      // updates the prefix for the account
      logger.info(`prisma.account.update in updatePrefix for ${ksn} initiated`);
      accountChange = await this.prisma.account.update({
        where: { ksn },
        data: { prefix },
      });
    } catch (error) {
      // handles any prisma errors
      logger.info({
        message: `prisma.account.update in updatePrefix for ${ksn} failed`,
        error,
      });
      handlePrismaErrors(error);
    }

    // sends back account change and successful response
    const payload: IResponse = {
      statusCode: 200,
      message: 'Prefix updated',
      data: { accountChange },
    };

    analytics.identify({
      userId: ksn.toString(),
      traits: {
        prefix: prefix,
        updatedAt: getPrismaStyleDateTime(),
      },
    });

    analytics.track({
      userId: ksn.toString(),
      event: 'account_updated',
      properties: {
        prefix: prefix,
        aidn: aidn,
      },
    });

    logger.info({
      message: `updatePrefix for ${ksn} succeeded`,
      payload,
      accountChange,
    });
    return payload;
  }
}
