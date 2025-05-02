import express, { json } from "express";
import cors from "cors";
import pgPromise from "pg-promise";
import "dotenv/config";

const app = express();
const port = 5000;
var dbconnectionURL = process.env.TINTAMAYTOES_DB_URL; 
console.log("db", dbconnectionURL);

app.use(cors());
app.use(json());

// connect to database
const pgp = pgPromise();
const db = pgp(dbconnectionURL);

// Testing to make sure it connects to the back end
app.get("/test-connection", function(req, res) {
  res.json("Welcome! Back end to Tin - Ta - Maytoes - API is now connected");
});

// GET one thread by id - /threads/id
// Get the id of the thread and parse it from string to integer 
// Fetch the thread
// Fetch the question for the thread
// Fetch the choices for the for the question
// Combine the questions and  choices
// Send the response back

// // GET a specific question and the choices - ScenarioGamePlay
app.get("/questions/:id", async (req, res) => {
  const questionId = parseInt(req.params.id);

  if (isNaN(questionId)) {
    return res.status(400).json({ error: "Invalid question ID" });
  }

  try {
    const question = await db.oneOrNone("SELECT id, text FROM questions WHERE id = $1", [questionId]);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const choices = await db.many(
      `SELECT id, text, value
       FROM choices
       WHERE question_id = $1
       ORDER BY RANDOM()
       LIMIT 2`,
      [questionId]
    );

    res.json({ question, choices });
  } catch (error) {
    console.error(`Error fetching question ${questionId}:`, error);
    res.status(500).json({ error: `Failed to fetch question ${questionId}` });
  }
});

// GET random initial question (4 or 5)
app.get("/threads", async (req, res) => {
  try {
    const initialQuestionIds = [4, 5];
    const randomQuestionId = initialQuestionIds[Math.floor(Math.random() * initialQuestionIds.length)];
    const question = await db.one("SELECT id, text FROM questions WHERE id = $1", [randomQuestionId]); 
    res.json([question]);
  } catch (error) {
    console.error("Error fetching threads:", error);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// GET all threads from the thread table
app.get("/previous-threads", async (req, res) => {
  try {
    const allThreads = await db.many("SELECT * FROM threads");
    res.json(allThreads);
  } catch (error) {
    console.error("Error fetching all threads:", error);
    res.status(500).json({ error: "Failed to fetch all threads" });
  }
});

// Update the thread as user plays
app.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { question_id, user_choice_selection } = req.body;

  try {
    // Update the thread 
    const result = await db.query(
      `UPDATE threads
      SET
        question_id = $1,
        user_choice_selection = $2
      WHERE id = $3`,
      [question_id, user_choice_selection, id]
    );

    res.json({ message: 'Thread updated successfully' });


  } catch (error) {
    console.error('Error updating thread:', error);
    res.status(500).json({ error: 'Failed to update thread' });
  }
});

app.listen(port, function() {
  console.log("Server is running on port " + port);
});