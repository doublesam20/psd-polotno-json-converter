const express = require('express');
const multer = require('multer');
const path = require('path');
const { convertPsdToJson, generatePolotnoJsonOutput } = require('./convert');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());

// app.use(cors({
//   origin: 'http://localhost:3000'
// }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ['http://localhost:3000', 'http://localhost:5000']);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


// Home route
app.get('/', (req, res) => {
    const message = req.query.message ? req.query.message : '';

    res.send(`
        <!doctype html>
        <html lang="en">
        <head>
            <!-- Required meta tags -->
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">

            <title>Upload PSD</title>
        </head>
        <body>
            <div class="container vh-100 d-flex justify-content-center align-items-center">
                <div class="row">
                    <div class="col-12 text-center" style="color: green">
                        <h1>${message}</h1>
                    </div>
                    <div class="col-12">
                        <form action="/upload" method="post" enctype="multipart/form-data">
                            <div class="mb-3">
                                <label for="psd" class="form-label">Upload PSD</label>
                                <input type="file" class="form-control" name="psd" id="psd">
                            </div>
                            <button type="submit" class="btn btn-primary">Upload</button>
                        </form>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Upload route
app.post('/upload', upload.single('psd'), async (req, res) => {
    try {
        const now = new Date();

        const dateTime = now.toISOString().replace(/:/g, '-').replace('T', '_').split('.')[0];

        const filename = `converted_${dateTime}.json`;

        const outputPath = path.join('src/converted', filename);

        const psdFilePath = req.file.path;

        const psdJson = convertPsdToJson(psdFilePath);
        const output = generatePolotnoJsonOutput(JSON.parse(psdJson));
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

        fs.unlinkSync(psdFilePath);

        // res.send(`Successfully converted PSD to JSON`);
        // res.redirect(`/?message=Successfully converted PSD to JSON`);
        // Instead of redirecting, download the file
        res.download(outputPath, filename, (err) => {
            if (err) {
                console.error('Error downloading file:', err.message);
                res.status(500).json({ error: 'Error downloading file' });
            } else {
                // Delete the file after download
                fs.unlinkSync(outputPath);
            }
        });

    } catch (error) {
        console.error('Error processing PSD:', error.message);
        res.status(500).json({ error: 'Error processing PSD' });
    }
});

app.listen(5000, () => console.log('Server started on port 5000'));
