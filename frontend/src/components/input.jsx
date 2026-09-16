import React from 'react';
import { Mic, Square } from "lucide-react";
import { useRef, useState } from "react";
import './style.css';

const Audioinput = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioFile, setAudioFile] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            const recorder = new MediaRecorder(stream);

            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: "audio/webm",
                });

                setAudioFile(audioBlob);

                // Stop microphone AFTER recording stops
                stream.getTracks().forEach((track) => track.stop());
            };

            // Start recording
            recorder.start();

            setIsRecording(true);

        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    const stopRecording = () => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
        ) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };
    return (
        <main className="app-container">
            <div className="app-card">
                <header className="top-nav">
                    <button className="icon-btn" aria-label="Menu">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                            <line x1="4" y1="7" x2="20" y2="7"></line>
                            <line x1="4" y1="12" x2="20" y2="12"></line>
                            <line x1="4" y1="17" x2="20" y2="17"></line>
                        </svg>
                    </button>

                    <h1 className="app-title">Session Word Cloud</h1>

                    <div className="daily-pill">
                        <svg className="leaf-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <circle cx="12" cy="12" r="6" />
                        </svg>
                        <span>Ready: 00:00</span>
                    </div>
                </header>

                <div className="workspace-grid">

                    <section className="record-section">
                        <h2 className="section-label">Live Session Recording</h2>

                        <div className="glow-disc">

                            <button
                                className={isRecording ? "stop-btn" : "play-btn"}
                                aria-label={
                                    isRecording ? "Stop Recording" : "Start Recording"
                                }
                                onClick={
                                    isRecording ? stopRecording : startRecording
                                }
                            >
                                {isRecording ? (
                                    <Square size={26} strokeWidth={2.5} />
                                ) : (
                                    <Mic size={28} strokeWidth={2.5} />
                                )}
                            </button>

                            <span className="start-text">
                                {isRecording ? "Recording..." : "Record Live"}
                            </span>

                        </div>

                        <p className="hint-text">
                            {isRecording
                                ? "Recording is in progress"
                                : "Click to start live capture with mic"}
                        </p>
                    </section>


                    <section className="upload-section">
                        <h2 className="section-label">Or Upload Session Audio</h2>

                        <div className="dropzone-box">
                            <span className="input-icon-lg">
                                <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                            </span>
                            <p className="drop-title">Drop audio file here, or browse</p>
                            <span className="file-constraints">
                                MP3, WAV, M4A, AAC, OGG, WEBM, FLAC (Max 25MB or 10 min)
                            </span>
                            <input type="file" className="file-input-hidden" accept=".mp3,.wav,.m4a,.aac,.ogg,.webm,.flac" />
                        </div>

                        <div className="action-row">
                            <button className="submit-btn" type="button">
                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                                </svg>
                                <span>Analyse & Generate Cloud</span>
                            </button>
                        </div>
                    </section>
                </div>
                <div>{audioFile && (
                    <audio
                        controls
                        src={URL.createObjectURL(audioFile)}
                    />
                )}</div>
                <nav className="bottom-nav">
                    <a href="#record" className="nav-item active">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                        </svg>
                        <span>Capture</span>
                    </a>
                    <a href="#cloud" className="nav-item">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                        </svg>
                        <span>Word Cloud</span>
                    </a>
                    <a href="#transcript" className="nav-item">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                        </svg>
                        <span>Transcript</span>
                    </a>
                </nav>
            </div>
        </main>
    );
};

export default Audioinput;