const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Endpoint to run the C++ compiler
app.post('/api/compile', (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'No query provided' });
    }

    const compilerPath = path.join(__dirname, 'compiler', 'compiler.exe');
    
    if (!fs.existsSync(compilerPath)) {
        return res.status(500).json({ error: 'Compiler binary not found. Please run "npm run build:cpp" first.' });
    }

    // Spawn the compiler process
    const child = spawn(compilerPath);
    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
        output += data.toString();
    });

    child.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    child.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ 
                error: `Compiler exited with code ${code}`, 
                details: errorOutput 
            });
        }

        try {
            const result = JSON.parse(output);
            res.json(result);
        } catch (e) {
            res.status(500).json({ 
                error: 'Failed to parse compiler output as JSON', 
                raw: output,
                details: e.message
            });
        }
    });

    // Send the query to the compiler's stdin
    child.stdin.write(query);
    child.stdin.end();
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Frontend is being served from ${path.join(__dirname, 'frontend')}`);
});
