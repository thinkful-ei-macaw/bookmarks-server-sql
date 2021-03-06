require("dotenv").config();
const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeArticlesArray } = require("./bookmark.fixtures");

describe.only("Bookmarks Endpoints", function() {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean the table", () => db("bookmarks").truncate());

  afterEach("cleanup", () => db("bookmarks").truncate());

  describe(`GET /bookmarks`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get("/bookmarks")
          .set("Authorization", "Bearer " + process.env.API_TOKEN)
          .expect(200, []);
      });
    });
    context("Given there are bookmarks in the database", () => {
      const testArticles = makeArticlesArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testArticles);
      });

      it("responds with 200 and all of the bookmarks", () => {
        return supertest(app)
          .get("/bookmarks")
          .set("Authorization", "Bearer " + process.env.API_TOKEN)
          .expect(200, testArticles);
      });
    });
  });

  describe(`GET /bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const articleId = 123456;
        return supertest(app)
          .get(`/bookmarks/${articleId}`)
          .set("Authorization", "Bearer " + process.env.API_TOKEN)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });
    context("Given there are bookmarks in the database", () => {
      const testArticles = makeArticlesArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testArticles);
      });

      it("responds with 200 and the specified bookmark", () => {
        const articleId = 2;
        const expectedArticle = testArticles[articleId - 1];
        return supertest(app)
          .get(`/bookmarks/${articleId}`)
          .set("Authorization", "Bearer " + process.env.API_TOKEN)
          .expect(200, expectedArticle);
      });
    });
  });
});
