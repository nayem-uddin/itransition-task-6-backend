require("dotenv").config();
const mysql = require("mysql2/promise");
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function createPresentationsTable() {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS presentations (title varchar(255) primary key, creator varchar(255), creationDate date)"
  );
}

async function getallPresentations() {
  await createPresentationsTable();
  const [rows] = await pool.query("SELECT * FROM presentations");
  return rows;
}

async function addNewPresentation(presentation) {
  const { title, creator, creationDate } = presentation;
  await pool.query(
    "INSERT INTO presentations (creator,title,creationDate) VALUES (?,?,?)",
    [creator, title, creationDate]
  );
}

async function getPresentation(title) {
  const [rows] = await pool.query(
    "SELECT body FROM slides WHERE presentationTitle = ?",
    [title]
  );
  return rows.map((slide) => slide.body);
}

async function createSlidesTable() {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS slides (id int primary key auto_increment, presentationTitle varchar(255), pageNo int, body JSON, FOREIGN KEY (presentationTitle) REFERENCES presentations (title) ON DELETE CASCADE)"
  );
}

async function addSlide(title, pageNo) {
  await createSlidesTable();
  const newSlide = JSON.stringify({ blocks: [] });
  const [rows] = await pool.query(
    "INSERT INTO slides (presentationTitle, pageNo, body) VALUES (?,?,?)",
    [title, pageNo, newSlide]
  );
  return rows;
}

async function updateSlide(title, pageNo, updatedSlide) {
  const slide = JSON.stringify(updatedSlide);
  const [rows] = await pool.query(
    "UPDATE slides SET body = ? WHERE presentationTitle = ? and pageNo = ?",
    [slide, title, Number(pageNo)]
  );
  return rows;
}

module.exports = {
  getallPresentations,
  addNewPresentation,
  getPresentation,
  addSlide,
  updateSlide,
  createPresentationsTable,
  createSlidesTable,
};
// async function test() {
//   const presentation = await getPresentation("new-slide-3");
//   console.log(presentation);
// }
// test();
