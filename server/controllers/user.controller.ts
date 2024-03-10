require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncError";
import jwt, { Secret } from "jsonwebtoken";
import ejs from 'ejs'
import path from "path";

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

      const activationToken = createActivationToken(user);
      console.log(activationToken);

      const data = {user:{name:user.name}, activationToken}
      const html = await ejs.renderFile(path.join(__dirname,"../mails/activation-mail.html"), data)

    } catch (error: any) {
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
