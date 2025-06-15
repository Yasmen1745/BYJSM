import express from "express";
import cookieParser from "cookie-parser";
import "dotenv/config";
import connectDb from "./config/db.js";
import booksRouter from "./routes/book.js";
import ordersRouter from "./routes/order.js";
import usersRouter from "./routes/user.js";
import frontRouter from "./routes/frontend.js";
import chatbotRouter from "./routes/chatbot.js";
import dashboardRouter from "./routes/dashboard.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/api/book", booksRouter);
app.use("/api/order", ordersRouter);
app.use("/api/user", usersRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/dashboard", dashboardRouter);
app.use(frontRouter);
app.use((req, res, next) => {
  res.render("404");
});

connectDb();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
