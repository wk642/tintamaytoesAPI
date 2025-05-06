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
app.get("/initial-thread", async (req, res) => {
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
app.put('/thread/:id/choice', async (req, res) => {
  const { id } = req.params;
  const { question_id, choice_id } = req.body;

  try {
    // Update the threadquestions table
    const result = await db.none( 
      ` INSERT INTO threadquestions (question_id, choice_id, thread_id)
      VALUES ($1, $2, $3)
      `,
      [question_id, choice_id, id]
    );
    res.json({ message: 'Choice inserted successfully' });
  } catch (error) {
    console.error('Error updating thread:', error);
    res.status(500).json({ error: 'Failed to update thread' });
  }
});

// POST to create a new thread
app.post("/threads", async (req, res) => {
  const { player_name } = req.body;
  try {
    const newThread = await db.one(
      "INSERT INTO threads (player_name, created_at) VALUES ($1, NOW()) RETURNING *",
      [player_name]
    );
    res.status(201).json(newThread);
  } catch (error) {
    console.error("Error creating a new thread:", error);

    res.status(500).json({ error: "Failed to create new thread" }); 
  }
});

// GET thread by ID
app.get("/threads/:id", async (req, res) => {
  const threadId = parseInt(req.params.id);

  if (isNaN(threadId)) {
    return res.status(400).json({ error: "Invalid thread ID" });
  }

  try {
    const thread = await db.oneOrNone("SELECT * FROM threads WHERE id = $1", [threadId]);
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    res.json(thread);
  } catch (error) {
    console.error(`Error fetching thread ${threadId}:`, error);
    res.status(500).json({ error: `Failed to fetch thread ${threadId}` });
  }
});

// POST to set a thread as favorite
app.post("/threads/:id/favorite", async (req, res) => {
  const threadId = parseInt(req.params.id);
  try {
    await db.none("UPDATE threads SET is_favorite = true WHERE id = $1", [threadId]);
    res.json({ message: "Thread favorited successfully" });
  } catch (error) {
    console.error(`Error unable ot favorite thread ${threadId}`, error);
    res.status(500).json({ error: `Failed to favorite thread ${threadId}` });
  }
});

app.server = app.listen(port, function() {
  console.log("Server is running on port " + port);
});

export default app;