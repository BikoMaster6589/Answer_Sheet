const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const connectPgSimple = require('connect-pg-simple');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const env = require('dotenv');

const PgSession = connectPgSimple(session);
const pool = require('./db');

const app = express();


env.config(); // Load environment variables from .env file

// --------------------------------------Middlewares--------------------------------------------------------------

app.use(
    session({
        store: new PgSession({
            pool: pool,
            tableName: 'session',
        }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }, 
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');


const verifyRole = (requiredRole, errorMessage) => {
    return (req, res, next) => {
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



//----------------------------------------------------------- Get Routes----------------------------------------------
app.get('/', (req, res) => {
    res.redirect('/signup'); 
});

app.get('/home', (req, res) => {
    if (!req.session.role) {
        return res.redirect('/signin'); 
    }
    res.render('index', { role: req.session.role, klo: req.session.roll_no });
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

app.get('/success',(req,res,next)=>{
    res.render("success.ejs");
})


app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err); 
        }
        res.redirect('/signin');
    });
});

app.get('/add-paper', verifyRole('teacher', 'Only for Teachers'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM papers');
        res.render('addPaper', { papers: result.rows, role: req.session.role });
    } catch (err) {
        console.error('Error fetching papers:', err);
        res.status(500).send('Failed to fetch papers.');
    }
});

app.get('/evaluate', verifyRole('student', 'Only for Students'), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM papers');
        res.render('selectPaper', { papers: result.rows, roll_no: req.session.roll_no, role: req.session.role, name: req.session.name });
    } catch (err) {
        console.error('Error fetching papers:', err);
        res.status(500).send('Failed to fetch papers.');
    }
});

app.get('/signin', (req, res) => {
    const error = req.session.error; 
    req.session.error = null; 
    res.render('signin', { error }); 
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

        res.render('evaluate', { questions: result.rows, paperId, roll_no: req.session.roll_no, role: req.session.role });
    } catch (err) {
        console.error('Error fetching questions:', err);
        res.status(500).send('Failed to fetch questions.');
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
        const result = await pool.query(
            `SELECT users.name AS student_name, users.roll_number AS student_roll_no,
                   papers.name AS paper_name, results.marks, papers.total_marks
            FROM results
            JOIN users ON results.roll_number = users.roll_number
            JOIN papers ON results.paper_id = papers.id`
        );

        res.render('results', { results: result.rows , role : req.session.role });
    } catch (err) {
        console.error('Error fetching results:', err);
        res.status(500).send('Failed to fetch results.');
    }
});

app.get('/signup', (req, res) => {
    res.render('signup');
});


//-------------------------------------------- Post Routes ----------------------------------------------------------------

app.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            req.session.error = 'User Not Found. Please Sign Up';
            return res.redirect('/signin');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            req.session.error = 'Invalid email or password.';
            return res.redirect('/signin');
        }

        req.session.role = user.role;
        req.session.roll_no = user.roll_number;
        req.session.name = user.name;

        res.redirect('/home');
    } catch (err) {
        console.error('Error during signin:', err);
        req.session.error = 'An error occurred. Please try again.';
        res.redirect('/signin');
    }
});


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

            if (userAnswer && userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase()) {
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

        res.redirect('/success');
    } catch (err) {
        console.error('Error evaluating results:', err);
        res.status(500).send('Failed to submit evaluation.');
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


// ------------------------------------------------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
