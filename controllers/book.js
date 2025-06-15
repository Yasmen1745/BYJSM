import Book from "../models/book.js";
import { validationResult } from "express-validator";

export const createBook = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const bookData = {
      ...req.body,
      // For now, we'll just store the file data in memory
      image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null,
    };

    const book = await Book.create(bookData);
    res.status(201).json(book);
  } catch (err) {
    console.error("Error creating book:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getBooks = async (req, res) => {
  const books = await Book.find();
  res.json(books);
};

export const getBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });
  res.json(book);
};

export const updateBook = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const updateData = { ...req.body };
    
    // Handle image upload if a new image is provided
    if (req.file) {
      updateData.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const book = await Book.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ message: err.message });
  }
};

export const deleteBook = async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });
  res.json({ message: "Book deleted" });
};
