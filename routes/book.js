import express from "express";
import {
  createBook,
  getBooks,
  getBook,
  updateBook,
  deleteBook,
} from "../controllers/book.js";
import {
  createBookValidator,
  updateBookValidator,
} from "../validators/book.validator.js";
import upload from "../config/multer.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post("/", auth(["admin"]), upload.single('image'), createBookValidator, createBook);
router.get("/", getBooks);
router.get("/:id", getBook);
router.put("/:id", auth(["admin"]), upload.single('image'), updateBookValidator, updateBook);
router.delete("/:id", auth(["admin"]), deleteBook);

export default router;
