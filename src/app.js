require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const ArticlesService = require("./articles-service");
const { NODE_ENV } = require("./config");
const winston = require("winston");
const uuid = require("uuid/v4");

const app = express();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: "info.log"
    })
  ]
});

if (NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple()
    })
  );
}

// set up middleware
app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(validateBearerToken);

function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get("Authorization");
  console.log(authToken);
  if (!authToken || authToken.split(" ")[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({
      error: "Unauthorized request"
    });
  }
  next();
}

app.get("/bookmarks", (req, res, next) => {
  const knexInstance = req.app.get("db");
  ArticlesService.getAllArticles(knexInstance)
    .then(articles => {
      res.json(articles);
    })
    .catch(next);
});

app.get("/bookmark/:id", (req, res, next) => {
  const knexInstance = req.app.get("db");
  ArticlesService.getById(knexInstance, req.params.id)
    .then(article => {
      if (!article) {
        return res.status(404).json({
          error: { message: `Bookmark doesn't exist` }
        });
      }
      res.json(article);
    })
    .catch(next);
});

app.post("/bookmark", (req, res) => {
  const { title, rating, description, url } = req.body;

  if (!title) {
    logger.error(`Title is required`);
    return res.status(400).send("Invalid data");
  }

  if (!rating || !Number(rating) || rating < 0 || rating > 5) {
    logger.error(`Rating is required`);
    return res.status(400).send("Invalid data");
  }

  if (!description) {
    logger.error(`Description is required`);
    return res.status(400).send("Invalid data");
  }

  if (!url) {
    logger.error(`Url is required`);
    return res.status(400).send("Invalid data");
  }

  const id = uuid();

  const bookmark = {
    id,
    title,
    rating,
    description
  };

  bookmarks.push(bookmark);
  logger.info(`Card with id ${id} created`);

  res
    .status(201)
    .location(`http://localhost:8080/card/${id}`)
    .json(bookmark);
});

app.delete("/bookmark/:id", (req, res) => {
  const { id } = req.params;

  const listIndex = bookmarks.findIndex(li => li.id === parseInt(id));

  if (listIndex === -1) {
    logger.error(`Bookmark with id ${id} not found.`);
    return res.status(404).send("Not Found");
  }

  bookmarks.splice(listIndex, 1);

  logger.info(`Bookmarks with id ${id} deleted.`);
  res.status(204).end();
});

// error handling
// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  let response;
  if (NODE_ENV === "production") {
    response = {
      error: {
        message: "Server error"
      }
    };
  } else {
    response = {
      message: error.message,
      error
    };
  }

  res.status(500).json(response);
};

app.use(errorHandler);

// the bottom line, literally

const bookmarks = [
  {
    id: 1,
    title: "Random Title",
    rating: 5
  }
];

module.exports = app;
