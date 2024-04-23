import express, {  Response } from "express";
import { PrismaClient } from "@prisma/client";
import { userRouter } from "./routes/userRoute";
import { searchRouter } from "./routes/searchRoute";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/search", searchRouter);

app.get("/status", async (res: Response) => {
  try {
    await prisma.$connect();
    res.json({ status: "Database connected" });
  } catch (error) {
    console.error("Error connecting to database:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
