import React, { useState } from 'react';
import { Container, Form, Button, Card } from 'react-bootstrap';
import axios from 'axios';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData();
      formData.append('psd', file);
      // formData.append('inputValue', inputValue);

      await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadStatus('File uploaded successfully');
    } catch (error) {
      // Handle error
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card className="p-4">
        <Card.Title className="text-center">PSD-Polotno Converter Form</Card.Title>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>Upload File</Form.Label>
              <Form.Control type="file" onChange={handleFileChange} />
            </Form.Group>

            {/*<Form.Group controlId="formInput" className="mb-3">*/}
            {/*  <Form.Label>Input Field</Form.Label>*/}
            {/*  <Form.Control*/}
            {/*    type="text"*/}
            {/*    placeholder="Enter input"*/}
            {/*    value={inputValue}*/}
            {/*    onChange={handleInputChange}*/}
            {/*  />*/}
            {/*</Form.Group>*/}

            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Form>
          {uploadStatus && <p style={{color: 'green'}}>{uploadStatus}</p>}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UploadForm;
