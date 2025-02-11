# 📚 **Online Exam Portal**  

Welcome to the **Online Exam Portal**, a modern and feature-rich platform designed for conducting online examinations efficiently. This project demonstrates a **full-stack web application**, integrating a powerful backend with a user-friendly frontend.

The platform enables students to take exams, teachers to upload and evaluate papers, and administrators to manage roles securely.

---

## 🚀 **Key Features**  

### 🔐 Secure Authentication and Role-Based Access  

- **User Registration & Login**: Secure authentication system with email-based sign-up and login.  
- **Session-Based Authentication**: Uses PostgreSQL-backed sessions for persistent logins.  
- **Password Encryption with BCrypt**: Ensures that user credentials are securely hashed.  

### 👤 User & Exam Management  

- **Students**:  
  - Attempt exams and submit answers for evaluation.  
  - View their results after evaluation.  

- **Teachers**:  
  - Upload new question papers.  
  - Evaluate student answers and assign marks.  
  - View all student results.  

### 📑 Paper & Question Management  

- **Upload Question Papers**: Teachers can upload text files containing questions and answers.  
- **Evaluate Student Responses**: Automatic and manual evaluation of answers.  
- **Result Generation**: Generates student scores and stores them in the database.  

### 🛠️ Admin Privileges  

- **Role-Based Dashboard**: Teachers and students see different views tailored to their access levels.  
- **Admin Controls**: Admins can manage users and ensure a smooth workflow.  

---

## 🛠 **Tech Stack**  

### 🖥️ **Frontend**  
- **HTML**: For page structure.  
- **CSS**: For styling and layout.  
- **EJS (Embedded JavaScript)**: For dynamic rendering of server-side templates.  

### ⚙️ **Backend**  
- **Node.js**: Fast and scalable backend framework.  
- **Express.js**: Handles routing and server logic.  

### 🗄️ **Database**  
- **PostgreSQL**: Stores users, exams, and results.  

### 🔐 **Security**  
- **BCrypt**: Encrypts user passwords for secure authentication.  
- **Session-Based Authentication**: Uses `connect-pg-simple` for secure session storage.  

---

## 🌐 **Live Server**  

## 🌐 **Live Server**  

🚀 The server is **live and running** at:  

🔗 **[[https://your-live-server-url.com](https://answer-sheet.onrender.com)]**  

Click the link above to access the **Online Exam Portal** and start using its features! 🎯  

---

## 📂 **Project Structure**  

### 📁 **Main Directories**  
1. **`public/`** - Contains static files like CSS, JavaScript, and images.  
2. **`views/`** - Stores EJS templates for rendering dynamic web pages.  
3. **`uploads/`** - Stores uploaded question papers and other files.  

### 📄 **Main Files**  
- **`db.js`** - Handles database connection with PostgreSQL.  
- **`server.js`** - Main application file managing routes and logic.  
- **`package.json`** - Contains project dependencies and scripts.  
- **`.env`** - Stores environment variables (session secrets, database credentials, etc.).  
- **`README.md`** - Documentation for the project.  

---

## ⚙️ **Setup & Installation**  

### 🔽 Clone the Repository  
Run the following command to clone the repository:  
```sh
git clone https://github.com/your-username/Online-Exam-Portal.git
cd Online-Exam-Portal
```



---
## 🔧 **Install Dependencies**
Install all required dependencies using:
```sh
npm install

```

---
### **🛠 Set Up Environment Variables**  
Create a .env file in the root directory and add:
```ini
SESSION_SECRET=your_secret_key
DATABASE_URL=your_postgresql_url

```
---
###** 🏁 Run the Server **
Start the server with:  
```sh
npm start
```
### 📌 The server will run on: http://localhost:3000 🚀


---

## 🔑 **User Roles & Access**  

### 👨‍🏫 **Teacher**  
- Upload & manage question papers  
- View student evaluations  

### 🎓 **Student**  
- Attempt question papers  
- Submit answers for evaluation  

---

## 📜 **API Routes**  

| **Method** | **Route**       | **Description**                          |
|-----------|---------------|------------------------------------------|
| `GET`    | `/`           | Redirect to Sign-up                     |
| `GET`    | `/signin`     | User login page                         |
| `GET`    | `/home`       | Dashboard (Role-based)                  |
| `GET`    | `/add-paper`  | Add question paper (Teacher only)       |
| `GET`    | `/evaluate`   | Evaluate papers (Student only)          |
| `POST`   | `/signup`     | Register a new user                     |
| `POST`   | `/signin`     | Login user                               |


---

---

✨ Thank you for exploring the **Online Exam Portal**! We hope this project helps in understanding and implementing online examination systems effectively.  

💡 **Contributions & Feedback** are always welcome! Feel free to submit issues, suggest improvements, or contribute to the repository.  

🚀 **Happy Coding & Learning!** 🎯  




