import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { sign } from "jsonwebtoken";

export const userRouter = express.Router();
const prisma = new PrismaClient();
require("dotenv").config();

const signupInput = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email().optional(),
  phoneNumber: z.string().regex(/^\d{10}$/),
  password: z.string().min(6),
});

//signup
userRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const { success } = signupInput.safeParse(body);

    if (!success) {
      return res.status(400).send("Invalid input");
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        password: hashedPassword,
        name: body.name,
        email: body.email,
        phoneNumber: body.phoneNumber,
      },
    });

    // add in global entry
    await prisma.global.create({
      data: {
        name: body.name,
        email: body.email,
        phoneNumber: body.phoneNumber,
      },
    });

    // Generate JWT token
    const jwt = await sign(
      { phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET_KEY!
    );
    res.status(200).send(jwt);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error occurred during signup");
  }
});

//signin

const signinInput = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/),
  password: z.string(),
});

userRouter.post("/signin", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const { success } = signinInput.safeParse(body);

    if (!success) {
      return res.status(400).send("Invalid input");
    }

    const user = await prisma.user.findUnique({
      where: { phoneNumber: body.phoneNumber },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(body.password, user.password);

    if (!passwordMatch) {
      res.status(401).json({
        message: "Incorrect password",
      });
      return;
    }

    const jwt = await sign(
      { phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET_KEY!
    );
    res.status(200).send(jwt);
    console.log(user);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error occurred during sign-in");
  }
});
