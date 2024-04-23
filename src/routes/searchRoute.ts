import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { verify } from "jsonwebtoken";

export const searchRouter = express.Router();
const prisma = new PrismaClient();



//middleware 
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.split(" ")[1];
  try {
    if (!token) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const decoded: any = verify(token, process.env.JWT_SECRET_KEY!);

    if (!decoded) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//search a phone number

const searchInput = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/),
});

searchRouter.post(
  "/number",

  async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const { success } = searchInput.safeParse(body);

      if (!success) {
        return res.status(400).send("Invalid input");
      }

      const user = await prisma.global.findMany({
        where: {
          phoneNumber: body.phoneNumber,
        },
      });

      if (!user) {
        return res.status(404).send("User not found");
      }

      res.status(200).send(user);
    } catch (e) {
      console.error(e);
      res.status(500).send("Error occurred during search");
    }
  }
);

//make a number spam
const markSpamInput = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/),
});

searchRouter.post("/mark-spam", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const { phoneNumber } = body;
    const { success } = markSpamInput.safeParse(body);

    if (!success) {
      return res.status(400).send("Invalid input");
    }

    const entriesToUpdate = await prisma.global.findMany({
      where: {
        phoneNumber,
      },
    });

    if (entriesToUpdate.length === 0) {
      return res
        .status(404)
        .json({ message: "No entries found with the specified phone number" });
    }

    // Get the current spam count from one of the entries
    const currentSpamCount = entriesToUpdate[0].spamCount;
    // increment
    const updatedEntries = await prisma.global.updateMany({
      where: {
        phoneNumber,
      },
      data: {
        spamCount: currentSpamCount + 1,
      },
    });

    res.status(200).json({
      message: "Phone number marked as spam successfully.",
      updatedEntries,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Error occurred while marking number as spam");
  }
});

//search by name
const searchNameInput = z.object({
  name: z.string(),
});

searchRouter.post("/search-by-name", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const { success } = searchNameInput.safeParse(body);

    if (!success) {
      return res.status(400).send("Invalid input");
    }

    const searchTerm = body.name;
    const users = await prisma.global.findMany({
      where: {
        name: {
          startsWith: searchTerm,
        },
      },
    });

    if (!users || users.length === 0) {
      return res.status(404).send("No users found");
    }

    res.status(200).send(users);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error occurred during search");
  }
});
