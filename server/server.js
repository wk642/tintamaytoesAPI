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

//get the choices
const getChoices = (questionId) => {
  return db.any('SELECT id, text, value FROM choices WHERE question_id = $1', questionId);
};

//  get all of the questions with  choices
app.get('/questions-and-choices', async (req, res) => {
  try {
    const questions = await db.any('SELECT id, text FROM questions');

    const questionsWithChoices = await Promise.all(
      questions.map(async (question) => {
        const choices = await getChoices(question.id);
        return { ...question, choices };
      })
    );

    res.json(questionsWithChoices);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// API endpoint to get a specific question with its choices by ID
app.get('/questions/:id', async (req, res) => {
  const questionId = parseInt(req.params.id);

  try {
    const question = await db.oneOrNone('SELECT id, text FROM questions WHERE id = $1', questionId);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const choices = await getChoices(questionId);

    res.json({ ...question, choices });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

app.listen(port, function() {
  console.log("Server is running on port " + port);
});