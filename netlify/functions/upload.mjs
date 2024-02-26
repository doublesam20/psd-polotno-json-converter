// lambda/upload.js
const multer = require('multer');
const path = require('path');
const { convertPsdToJson, generatePolotnoJsonOutput } = require('../convert');
const fs = require('fs');
const upload = multer({ dest: '/tmp/uploads/' });

exports.handler = async (event, context) => {
  try {
    const now = new Date();
    const dateTime = now.toISOString().replace(/:/g, '-').replace('T', '_').split('.')[0];
    const filename = `converted_${dateTime}.json`;
    const outputPath = path.join('src/converted', filename);
    const psdFilePath = event.body.file.path;
    const psdJson = convertPsdToJson(psdFilePath);
    const output = generatePolotnoJsonOutput(JSON.parse(psdJson));
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    fs.unlinkSync(psdFilePath);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Successfully converted PSD to JSON' }),
    };
  } catch (error) {
    console.error('Error processing PSD:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error processing PSD' }),
    };
  }
};
