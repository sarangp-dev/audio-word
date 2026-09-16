# Audio Word Cloud

A full-stack web application that takes an audio recording or audio file, analyzes the spoken content using Google Gemini, and generates a visual word cloud based on the important topics discussed.

The project was built as part of a technical interview task.

## Features

* Record audio directly from the browser
* Upload an existing audio file
* Supports MP3, WAV, M4A, AAC, OGG, WebM and FLAC
* File type and size validation
* Maximum file size of 25 MB
* Upload audio using `FormData`
* Analyze audio using Google Gemini AI
* Extract important words from the audio
* Remove common filler and unnecessary words
* Give importance values to words
* Generate a word cloud
* Download the word cloud as a PNG
* Handle temporary Gemini API errors using fallback models

## Tech Stack- MERN Stack(np)

### Frontend

* React
* Vite
* Axios
* Lucide React
* WordCloud.js
* HTML5 Canvas
* MediaRecorder API

### Backend

* Node.js
* Express.js
* Multer
* Google Gemini API
* dotenv
* CORS

## How It Works

 text
Audio Recording / File Upload
            ↓
       File Validation
            ↓
       FormData Upload
            ↓
      Express Backend
            ↓
     Multer Middleware
            ↓
       Audio Buffer
            ↓
      Google Gemini AI
            ↓
      Important Words
            ↓
      React Frontend
            ↓
       Word Cloud
            ↓
       Download PNG
 

## 1. Audio Input

The application supports two ways to provide audio.

### Microphone Recording

The browser's `MediaRecorder` API is used to record audio.

When the user starts recording:

* Microphone permission is requested.
* The audio stream is received using `getUserMedia()`.
* `MediaRecorder` records the audio in small chunks.
* The chunks are stored temporarily.
* When recording stops, the chunks are combined into a `Blob`.
* The Blob is converted into an audio `File`.
* The recorded audio can then be played and analyzed.

The microphone tracks are stopped after recording is finished.

### Audio File Upload

Users can also select an existing audio file.

The frontend checks the file before uploading it.

Supported formats:

 text
.mp3
.wav
.m4a
.aac
.ogg
.webm
.flac
 

The maximum file size is **25 MB**.

If the file is not supported or is larger than 25 MB, an error message is shown.

## 2. Sending Audio to Backend

When the user clicks **Analyse & Generate**, the audio file is added to a `FormData` object.

 javascript
const formData = new FormData();

formData.append("audio", audioFile);
 

Axios sends the audio to the backend:

 text
POST /api/upload
 

The backend receives the audio as a multipart form-data request.

## 3. Backend Audio Handling

The backend is built with Express.js.

Multer is used to handle the uploaded audio file.

The project uses Multer memory storage, so the audio is available in:

 javascript
req.file.buffer
 

The basic backend flow is:

 text
Request
   ↓
Express Router
   ↓
Multer
   ↓
req.file
   ↓
Controller
 

The audio is then passed to the AI processing section.

## 4. Gemini AI Processing

The audio buffer is converted into Base64:

 javascript
req.file.buffer.toString("base64")
 

The audio data and its MIME type are then sent to Google Gemini.

The AI analyzes the audio and identifies the important words and topics.

The prompt is designed to:

1. Understand the spoken content
2. Remove common filler words
3. Remove unnecessary conversation
4. Normalize words where needed
5. Find the main topics
6. Give importance values to the words
7. Return words that are present in the audio

Example response:

 json
[
  {
    "text": "javascript",
    "value": 90
  },
  {
    "text": "react",
    "value": 75
  },
  {
    "text": "backend",
    "value": 60
  }
]
 

The `value` is used to decide the size of each word in the word cloud.

## 5. AI Model Fallback

The backend includes fallback handling for temporary Gemini API problems.

For example:

* `429` - Rate limit
* `503` - Service temporarily unavailable

If the first model cannot process the request because of these temporary errors, the backend can try another configured model.

This helps prevent the request from failing immediately.

## 6. JSON Response

The backend asks Gemini to return the result in JSON format.

The response is then checked before sending it to the frontend.

The frontend expects data in this format:

 json
[
  {
    "text": "react",
    "value": 80
  }
]
 

If the response is not in the expected format, an error message is shown.

## 7. Word Cloud Generation

After receiving the words from the backend, React stores them in state.

The `wordcloud` library then draws the words on an HTML5 `<canvas>`.

The word size is based on the importance value received from Gemini.

 text
Higher value → Bigger word
Lower value  → Smaller word
 

The final result is displayed as a visual word cloud.

## 8. Download Word Cloud

The generated word cloud is stored on the HTML5 Canvas.

When the user clicks the download button:

 javascript
canvas.toDataURL("image/png");
 

The canvas is converted into a PNG image.

A temporary download link is created in the browser, allowing the user to save the word cloud locally.

No additional image processing is required on the backend.

## Error Handling

### Frontend

The application handles:

* Unsupported file types
* Files larger than 25 MB
* Microphone permission errors
* Recording errors
* API request errors

### Backend

The backend handles:

* Missing audio files
* Invalid uploads
* Gemini API errors
* Rate limits
* Temporary model errors
* Invalid AI responses

The application displays simple error messages to the user.

## Project Structure

 text
audio-word/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Audioinput.jsx
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── controller.js
│   │   ├── middleware.js
│   │   └── routes/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
 

## Environment Variables

API keys and other sensitive values are stored in `.env` files.

Example:

 env
GEMINI_API_KEY=your_api_key_here
 

The `.env` file is not pushed to GitHub.

Never put the actual API key directly in the source code.

## Running the Project Locally

### 1. Clone the repository

 bash
git clone <your-repository-url>

cd audio-word
 

### 2. Start the Backend

 bash
cd backend

npm install

npm run dev
 

Create a `.env` file inside the `backend` folder and add the required API key.

### 3. Start the Frontend

Open another terminal:

 bash
cd frontend

npm install

npm run dev
 

The frontend will start using the Vite development server.

## API

### Upload Audio

 text
POST /api/upload
 

Request type:

 text
multipart/form-data
 

Form field:

 text
audio
 

Example response:

 json
{
  "words": [
    {
      "text": "react",
      "value": 80
    },
    {
      "text": "javascript",
      "value": 70
    }
  ]
}
 

## Git & Security

Sensitive files are excluded using `.gitignore`.

 gitignore
**/.env
**/node_modules/
**/dist/
 

API keys and environment variables are therefore not stored in the GitHub repository.

## What I Learned

While building this project, I learned and worked with:

* React state and refs
* Browser audio recording
* MediaRecorder API
* File validation
* FormData
* Axios
* Express.js
* Express middleware
* Multer
* REST API development
* Google Gemini AI
* AI prompt design
* JSON response handling
* Error handling
* HTML5 Canvas
* WordCloud.js
* PNG generation

## Future Improvements

Some improvements I would like to add in the future:

* User authentication
* Save previous word clouds
* Display the complete transcription
* Support multiple languages
* More word cloud customization options
* Different color themes
* Audio playback controls
* Automated testing

## Author

**Sarang P**

BCA Student | MERN Stack Developer

GitHub: `https://github.com/sarangp-dev`

LinkedIn: `https://linkedin.com/in/sarang-p-3b1367424`
