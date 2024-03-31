require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncError";
import jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import SendMail from "../utils/SendMail";

// Registrtion user
interface IRegistration {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registrationUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password }: IRegistration = req.body;
      const emailExist = await userModel.findOne({ email: email });
      if (emailExist) {
        return next(new ErrorHandler("Email alreafy exist", 400));
      }
      const user: IRegistration = {
        email,
        password,
        name,
      };

      // After user registeration is complete then OTP will generate and sent the user mail ID
      const activationToken = createActivationToken(user);
      const activeCode = activationToken?.activationCode

      const data = { user: { name: user.name }, activeCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await SendMail({
          email: user?.email,
          subject: "Account Activation",
          template: "activation-mail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please check your email ${user?.email} to activate your account`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        console.log(error.message, 'error on line no. 60')
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      console.log(error, 'error on line no. 64')
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};
