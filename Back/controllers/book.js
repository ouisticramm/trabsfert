const mongoose = require("mongoose");
const Book = require("../models/Book");
const multer = require("multer");
const { upload, optimizeImage } = require("../middleware/multer-config");

exports.createBook = async (req, res, next) => {
  try {
    await optimizeImage(req, res, next);
    const book = new Book({
      userId: req.auth.userId,
      title: req.body.title,
      author: req.body.author,
      imageUrl: req.file.filename,
      year: req.body.year,
      genre: req.body.genre,
      ratings: [],
      averageRating: 0,
    });
    await book.save();
    res.status(201).json({ message: "Livre créé !" });
  } catch (error) {
    next(error);
  }
};

exports.modifyBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ error: "Livre non trouvé !" });
    }
    if (req.auth.userId !== book.userId) {
      return res
        .status(403)
        .json({ error: "Vous n'êtes pas autorisé à modifier ce livre !" });
    }
    await Book.updateOne(
      { _id: req.params.id },
      {
        title: req.body.title,
        author: req.body.author,
        year: req.body.year,
        genre: req.body.genre,
      }
    );
    res.status(200).json({ message: "Livre mis à jour !" });
  } catch (error) {
    next(error);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ error: "Livre non trouvé !" });
    }
    if (req.auth.userId !== book.userId) {
      return res
        .status(403)
        .json({ error: "Vous n'êtes pas autorisé à supprimer ce livre !" });
    }
    await Book.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Livre supprimé !" });
  } catch (error) {
    next(error);
  }
};

exports.getOneBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ error: "Livre non trouvé !" });
    }
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
};

exports.getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};

exports.bestRatings = async (req, res, next) => {
  try {
    const books = await Book.find().sort({ averageRating: -1 });
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};

exports.rateOneBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ error: "Livre non trouvé !" });
    }
    const rating = {
      userId: req.auth.userId,
      grade: req.body.grade,
    };
    book.ratings.push(rating);
    book.averageRating = calculateAverageRating(book.ratings);
    await book.save();
    res.status(200).json({ message: "Note ajoutée !" });
  } catch (error) {
    next(error);
  }
};

const calculateAverageRating = (ratings) => {
  let sum = 0;
  for (let i = 0; i < ratings.length; i++) {
    sum += ratings[i].grade;
  }
  return sum / ratings.length;
};
