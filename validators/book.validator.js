import { body } from "express-validator";

const allowedCategories = [
  "Fiction",
  "Science",
  "Biography",
  "Fantasy",
  "Romance",
  "Mystery",
  "History",
  "Horror",
  "Self-help",
  "Children",
  "Technology",
  "Business",
  "Islam",
];

export const createBookValidator = [
  body("title").notEmpty().withMessage("Title is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn(allowedCategories)
    .withMessage(`Category must be one of: ${allowedCategories.join(", ")}`),
];

export const updateBookValidator = [
  body("title").optional().notEmpty().withMessage("Title cannot be empty"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("category")
    .optional()
    .isIn(allowedCategories)
    .withMessage(`Category must be one of: ${allowedCategories.join(", ")}`),
];
