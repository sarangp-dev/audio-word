import React, { useRef, useState, useEffect } from 'react';
import { Mic, Square, Loader2, Download, Music } from "lucide-react";
import './style.css';

const Audioinput = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioFile, setAudioFile] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [cloudImageUrl, setCloudImageUrl] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const fileInputRef = useRef(null);

    // Keep object URL in sync with audioFile state and clean up memory
    useEffect(() => {
        if (!audioFile) {
            setAudioUrl(null);
            return;
        }

        const url = URL.createObjectURL(audioFile);
        setAudioUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [audioFile]);

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
                stream.getTracks().forEach((track) => track.stop());
            };

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

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioFile(file);
        }
    };

    const handleAnalyze = async () => {
        if (!audioFile) {
            alert("Please record or select an audio file first.");
            return;
        }

        setIsAnalyzing(true);
        setCloudImageUrl(null);

        try {
            // Replace this mock timeout with your actual backend upload/generation API
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Set placeholder image or backend response URL
            setCloudImageUrl("https://picsum.photos/600/300");
        } catch (error) {
            console.error("Error generating cloud:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDownload = () => {
        if (!cloudImageUrl) return;
        const link = document.createElement("a");
        link.href = cloudImageUrl;
        link.download = "session-word-cloud.png";
        link.click();
    };

    const handledelete = () => {
        setAudioFile(null);
        audioUrl(null);


    }
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
                        <span>{isRecording ? "Live" : "Ready: 00:00"}</span>
                    </div>
                </header>

                <div className="workspace-grid">
                    {/* Live Recording Section */}
                    <section className="record-section">
                        <h2 className="section-label">Live Session Recording</h2>

                        <div className="glow-disc">
                            <button
                                className={isRecording ? "stop-btn" : "play-btn"}
                                aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                                onClick={isRecording ? stopRecording : startRecording}
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

                    {/* Upload & Audio Preview Section */}
                    <section className="upload-section">
                        <h2 className="section-label">Or Upload Session Audio</h2>

                        <div
                            className="dropzone-box"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ cursor: 'pointer' }}
                        >
                            {audioFile ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
                                    <Music size={28} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                        {audioFile.name || "Microphone Recording.webm"}
                                    </span>
                                    <audio
                                        controls
                                        src={audioUrl}
                                        style={{ width: '90%', maxWidth: '320px', marginTop: '6px' }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                        Click to change file
                                    </span>
                                </div>
                            ) : (
                                <>
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
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="file-input-hidden"
                                accept=".mp3,.wav,.m4a,.aac,.ogg,.webm,.flac"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                        </div>
                        {!audioFile ? (
                            <div className="action-row" >
                                <button
                                    className="submit-btn"
                                    type="button"
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || !audioFile}
                                >
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                                    </svg>
                                    <span>{isAnalyzing ? "Processing Audio..." : "Analyse & Generate Cloud"}</span>
                                </button>

                            </div>) : (

                            <div
                                className="action-row"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: '12px',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <button
                                    className="submit-btn"
                                    type="button"
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || !audioFile}
                                    style={{
                                        flex: '1 1 0',
                                        minWidth: 0,
                                        width: 'auto',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                                    </svg>
                                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                        {isAnalyzing ? "Processing..." : "Analyse & Generate"}
                                    </span>
                                </button>
                                <button
                                    className="submit-btn"
                                    type="button"
                                    onClick={handledelete}

                                    style={{
                                        flex: '1 1 0',
                                        minWidth: 0,
                                        width: 'auto',
                                        whiteSpace: 'nowrap',
                                        background: '#ef4444',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >

                                    <svg
                                        viewBox="0 0 24 24"
                                        width="18"
                                        height="18"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                        <line x1="10" y1="11" x2="10" y2="17" />
                                        <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                        Delete
                                    </span>
                                </button>
                            </div>)}

                    </section>

                    {/* Word Cloud Result Section */}
                    <section className="upload-section" style={{ gridColumn: 'span 2', marginLeft: '10%', marginRight: '10%' }}>
                        <h2 className="section-label">Generated Word Cloud</h2>

                        <div className="dropzone-box" style={{ minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isAnalyzing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <Loader2 className="spinner" size={36} style={{ animation: 'spin 1s linear infinite' }} />
                                    <span>Generating word cloud visualization...</span>
                                </div>
                            ) : cloudImageUrl ? (
                                <img
                                    src={cloudImageUrl}
                                    alt="Generated Word Cloud"
                                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px' }}
                                />
                            ) : (
                                <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                                    Generated cloud will appear here
                                </span>
                            )}
                        </div>

                        <div className="action-row">
                            <button
                                className="submit-btn"
                                type="button"
                                onClick={handleDownload}
                                disabled={!cloudImageUrl || isAnalyzing}
                            >
                                <Download size={18} />
                                <span>Download Word Cloud</span>
                            </button>
                        </div>
                    </section>
                </div>

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
                        <span>History</span>
                    </a>
                </nav>
            </div>
        </main>
    );
};

export default Audioinput;