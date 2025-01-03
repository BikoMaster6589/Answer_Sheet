const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const pool = require('./db');
const app = express();
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const env = require('dotenv');

const PgSession = connectPGSimple(session);

// Session configuration
app.use(
    session({
        store: new PgSession({
            pool: db, // Connection pool
            tableName: 'session', // Table name to store session data
          }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, 
    })
);
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Middleware to verify the user role
const verifyRole = (requiredRole, errorMessage) => {
    return (req, res, next) => {
        console.log('Session User:', req.session.role);
        if (!req.session.role) {
            return res.status(401).send('Unauthorized: Please log in.');
        }

        if (req.session.role !== requiredRole) {
            return res.status(403).send(errorMessage || 'Forbidden: Access denied.');
        }

        next();
    };
};

// Ensure 'uploads/' directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/', (req, res) => {
    res.redirect('/signup'); // Redirects to the signin page initially
});

app.get('/home', (req, res) => {

    if (!req.session.role) {
        return res.redirect('/signin'); // Redirect if not authenticated
    }
    if (req.session.role === 'student') {
        res.render('index',{role : req.session.role , klo : req.session.roll_no}); // Create 'studentDashboard.ejs'
    } else if (req.session.role === 'teacher') {
        res.render('index',{role:req.session.role , klo : req.session.roll_no}); // Create 'teacherDashboard.ejs'
    }
});

app.get('/set-roll-number', async (req, res) => {
    if (!req.session.role || req.session.role !== 'student') {
        return res.status(403).send('Only students can set their roll number.');
    }

    try {
        if (!req.session.rollNumber) {
            return res.status(404).send('Roll number not found in session.');
        }

        res.send(`Roll number dynamically set to ${req.session.rollNumber}`);
    } catch (err) {
        console.error('Error setting roll number:', err);
        res.status(500).send('Failed to set roll number.');
    }
});

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err); // Pass the error to the next middleware for handling
      }
      res.redirect('/signin'); // Redirect to the home page or login page
    });
  });
  


app.get('/add-paper', verifyRole('teacher', 'Only for Teachers'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM papers');
        res.render('addPaper', { papers: result.rows , role : req.session.role });
    } catch (err) {
        console.error('Error fetching papers:', err);
        res.status(500).send('Failed to fetch papers.');
    }
});

app.get('/evaluate', verifyRole('student', 'Only for Students'), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM papers');
        res.render('selectPaper', { papers: result.rows, roll_no: req.session.roll_no , role:req.session.role, name : req.session.name});
        console.log(req.session.name);
        // console.log(name);
    } catch (err) {
        console.error('Error fetching papers:', err);
        res.status(500).send('Failed to fetch papers.');
    }
});

app.get('/signin', (req, res) => {
    res.render('signin'); 
});

app.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).send('Invalid email or password.');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).send('Invalid email or password.');
        }

        req.session.role = user.role;
        req.session.roll_no = user.roll_number;
        req.session.name = user.name;


        console.log(req.session);
        res.redirect('/home');
    } catch (err) {
        console.error('Error during signin:', err);
        res.status(500).send('Failed to sign in.');
    }
});

app.get('/evaluate/:studentId/:paperId', async (req, res) => {
    const { studentId, paperId } = req.params;
    try {
        const result = await pool.query(
            'SELECT id, question FROM questions WHERE paper_id = $1',
            [paperId]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('No questions found for this paper.');
        }

        res.render('evaluate', { questions: result.rows, paperId, roll_no: req.session.roll_no , role : req.session.role});
    } catch (err) {
        console.error('Error fetching questions:', err);
        res.status(500).send('Failed to fetch questions.');
    }
});


// Route use to Calculate the Score of the Stdents

app.post('/evaluate/:paperId', verifyRole('student'), async (req, res) => {
    const { roll_no } = req.body;
    const paper_id = req.params.paperId;
    let totalMarks = 0;
    try {
        const questionsQuery = await pool.query(
            'SELECT id, answer FROM questions WHERE paper_id = $1 ORDER BY id ASC',
            [paper_id]
        );

        if (questionsQuery.rows.length === 0) {
            return res.status(404).send('No questions found for this paper.');
        }

        const questions = questionsQuery.rows;

        const paperQuery = await pool.query(
            'SELECT marks_per_question FROM papers WHERE id = $1',
            [paper_id]
        );

        if (paperQuery.rows.length === 0) {
            return res.status(404).send('Paper not found.');
        }

        const marksPerQuestion = paperQuery.rows[0].marks_per_question;

        questions.forEach((question, index) => {
            const userAnswer = req.body[`marks_${index}`];

            if (
                userAnswer &&
                userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase()
            ) {
                totalMarks += marksPerQuestion;
            }
        });

        const existingResult = await pool.query(
            'SELECT * FROM results WHERE roll_number = $1 AND paper_id = $2',
            [roll_no, paper_id]
        );

        if (existingResult.rows.length > 0) {
            await pool.query(
                'UPDATE results SET marks = $1 WHERE roll_number = $2 AND paper_id = $3',
                [totalMarks, roll_no, paper_id]
            );
        } else {
            await pool.query(
                'INSERT INTO results (roll_number, paper_id, marks) VALUES ($1, $2, $3)',
                [roll_no, paper_id, totalMarks]
            );
        }

        res.redirect('/home');
    } catch (err) {
        console.error('Error evaluating results:', err);
        res.status(500).send('Failed to submit evaluation.');
    }
});



app.post('/evaluate', async (req, res) => {
    const { roll_no } = req.body;

    if (!roll_no) {
        return res.status(400).send('Roll number is required');
    }

    console.log('Evaluating for roll number:', roll_no);

    try {
        res.send('Evaluation submitted successfully');
    } catch (err) {
        console.error('Error processing evaluation:', err);
        res.status(500).send('Failed to evaluate');
    }
});

app.get('/result/:rollNumber', async (req, res) => {
    const { rollNumber } = req.params;

    try {
        const result = await pool.query(
            `SELECT papers.name AS paper_name, results.marks
            FROM results
            JOIN papers ON results.paper_id = papers.id
            WHERE results.roll_number = $1`,
            [rollNumber]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('No results found for this roll number.');
        }

        res.render('results', { rollNumber, results: result.rows });
    } catch (err) {
        console.error('Error fetching results:', err);
        res.status(500).send('Failed to fetch results.');
    }
});

app.get('/results', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT users.name AS student_name, users.roll_number AS student_roll_no,
                   papers.id AS paper_id, results.marks, papers.total_marks
            FROM results
            JOIN users ON results.roll_number = users.roll_number
            JOIN papers ON results.paper_id = papers.id
        `);

        res.render('results', { results: result.rows , role : req.session.role});
    } catch (err) {
        console.error('Error fetching results:', err);
        res.status(500).send('Failed to fetch results.');
    }
});

app.post('/add-paper', upload.single('questionFile'), verifyRole('teacher'), async (req, res) => {
    const { name, totalMarks, marks_per_question } = req.body;
    const questionFile = req.file;

    try {
        if (!questionFile) {
            return res.status(400).send('No file uploaded.');
        }

        const fileContent = fs.readFileSync(`uploads/${questionFile.filename}`, 'utf-8');
        const questionAnswerPairs = fileContent
            .split('\n')
            .map(line => line.trim().split('|'))
            .filter(pair => pair.length === 2);

        const paperResult = await pool.query(
            'INSERT INTO papers (name, total_marks, marks_per_question) VALUES ($1, $2, $3) RETURNING id',
            [name, totalMarks, marks_per_question]
        );
        const paperId = paperResult.rows[0].id;

        for (const [question, answer] of questionAnswerPairs) {
            await pool.query('INSERT INTO questions (paper_id, question, answer) VALUES ($1, $2, $3)', [paperId, question, answer]);
        }

        res.redirect('/add-paper');
    } catch (err) {
        console.error('Error processing uploaded file:', err);
        res.status(500).send('Failed to process uploaded file.');
    }
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const { name, roll_no, email, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (name, roll_number, email, password, role) VALUES ($1, $2, $3, $4, $5)',
            [name, roll_no, email, hashedPassword, role]
        );

        res.redirect('/signin');
    } catch (err) {
        console.error('Error during signup:', err);
        res.status(500).send('Failed to sign up. Ensure roll number and email are unique.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
