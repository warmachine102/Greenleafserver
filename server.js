// server.js

// Import necessary modules
const express = require('express'); // Express.js for creating the server
const fs = require('fs'); // File system module for reading and writing files
const path = require('path'); // Path module for handling file paths

const app = express(); // Create an Express application
const port = 3000; // Define the port the server will listen on

// Middleware to parse request bodies.  This is needed to access data sent in POST requests.
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.json()); // For parsing application/json (though not strictly needed for this example, good practice to include)

// Serve static files from the 'public' directory.
// This makes files in the 'public' folder accessible directly from the browser.
app.use(express.static(path.join(__dirname, 'public')));

// --- Signup Endpoint ---
app.post('/signup', (req, res) => {
    // 1. Extract email and password from the request body
    const { email, password } = req.body;

    // 2. Basic input validation (you can add more robust validation)
    if (!email || !password) {
        return res.status(400).send('Email and password are required.');
    }

    // --- **Security Warning:** ---
    // Storing passwords directly in plain text in a JSON file is extremely insecure for a real application.
    // In a production environment, you MUST use password hashing (like bcrypt) to securely store passwords.
    // For this simple example, we are skipping password hashing for demonstration purposes, but DO NOT do this in real projects.

    // 3. Prepare user data to be saved
    const newUser = {
        email: email,
        password: password, // Insecure: Storing password in plain text!
        timestamp: new Date().toISOString() // Add a timestamp for when the user signed up
    };

    const usersFilePath = path.join(__dirname, 'users.json');

    // 4. Read existing users from users.json
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        let users = []; // Initialize users array
        if (!err) {
            // If no error, try to parse existing data, if any.
            try {
                users = JSON.parse(data);
            } catch (parseError) {
                // If parsing fails (e.g., empty or invalid JSON), start with an empty array.
                console.error('Error parsing users.json, starting with empty user list.', parseError);
                users = [];
            }
        } else if (err.code === 'ENOENT') {
            // If file not found error (ENOENT), it means users.json doesn't exist yet.
            // We will create it later.
            console.log('users.json not found, will create a new one.');
        } else {
            // For other errors during file reading, log the error and send an error response.
            console.error('Error reading users.json:', err);
            return res.status(500).send('Failed to read user data.');
        }

        // 5. Add the new user to the users array
        users.push(newUser);

        // 6. Write the updated users array back to users.json
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error writing to users.json:', writeErr);
                return res.status(500).send('Signup failed: Could not save user data.');
            }

            // 7. Send a success response to the client
            res.status(200).send('Signup successful!');
        });
    });
});

// --- Login Endpoint ---
app.post('/login', (req, res) => {
    // 1. Extract email and password from the request body
    const { email, password } = req.body;

    // 2. Basic input validation
    if (!email || !password) {
        return res.status(400).send('Email and password are required.');
    }

    const usersFilePath = path.join(__dirname, 'users.json');

    // 3. Read users data from users.json
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(401).send('Login failed: No users registered yet.'); // Or "Invalid credentials" for security
            }
            console.error('Error reading users.json for login:', err);
            return res.status(500).send('Login failed: Could not read user data.');
        }

        let users = [];
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing users.json during login.', parseError);
            return res.status(500).send('Login failed: Corrupted user data.');
        }

        // 4. Check if there is a user with the provided email and password
        const user = users.find(u => u.email === email && u.password === password); // Insecure password comparison

        if (user) {
            // 5. If user found, send a success response
            res.status(200).send('Login successful!');
        } else {
            // 6. If user not found (or credentials don't match), send an error response
            res.status(401).send('Login failed: Invalid email or password.'); // 401 Unauthorized status
        }
    });
});

// --- Start the server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
