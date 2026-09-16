import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import WordCloud from 'wordcloud';
import { Mic, Square, Loader2, Download, Music, AlertCircle } from "lucide-react";
import './style.css';

const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".webm", ".flac"];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB limit[cite: 1]

const Audioinput = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioFile, setAudioFile] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [words, setWords] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);
    const timerRef = useRef(null);
    const canvasRef = useRef(null);
    const canvasContainerRef = useRef(null);

    // Live recording elapsed timer[cite: 1]
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
        const secs = (totalSeconds % 60).toString().padStart(2, "0");
        return `${mins}:${secs}`;
    };

    // Sync object URL with audioFile and avoid memory leaks
    useEffect(() => {
        if (!audioFile) {
            setAudioUrl(null);
            return;
        }

        const url = URL.createObjectURL(audioFile);
        setAudioUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [audioFile]);

    // Cleanup active mic tracks if component unmounts
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Render word cloud on canvas when words state updates[cite: 1]
    useEffect(() => {
        if (!words || words.length === 0 || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const container = canvasContainerRef.current;

        const targetWidth = container ? container.offsetWidth : 600;
        const targetHeight = 320;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const formattedList = words.map((w) => [w.text, w.value]);

        WordCloud(canvas, {
            list: formattedList,
            gridSize: Math.round(16 * targetWidth / 1024),
            weightFactor: (size) => Math.max(14, (size / 100) * 44),
            fontFamily: "Inter, sans-serif",
            color: () => {
                const palette = ["#2563eb", "#0284c7", "#0d9488", "#4f46e5", "#7c3aed", "#059669"];
                return palette[Math.floor(Math.random() * palette.length)];
            },
            rotateRatio: 0.3,
            rotationSteps: 2,
            backgroundColor: "#ffffff",
            drawOutOfBound: false,
        });
    }, [words]);

    const startRecording = async () => {
        setErrorMessage("");
        setWords(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const recordedBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const recordedFile = new File([recordedBlob], "Microphone-Recording.webm", {
                    type: "audio/webm",
                });
                setAudioFile(recordedFile);

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                    streamRef.current = null;
                }
            };

            recorder.start();
            setRecordingTime(0);
            setIsRecording(true);
        } catch (error) {
            console.error("Microphone access failed:", error);
            if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                setErrorMessage("Microphone access was denied. Please allow microphone permissions in your browser settings.");
            } else {
                setErrorMessage("Unable to access microphone. Please check your audio input device.");
            }
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
        setErrorMessage("");
        const file = e.target.files?.[0];
        if (!file) return;

        const fileExt = "." + file.name.split(".").pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
            setErrorMessage(`Invalid audio format (${fileExt}). Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setErrorMessage("File exceeds the 25 MB limit. Please select a smaller recording.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setWords(null);
        setAudioFile(file);
    };

    const handledelete = () => {
        setAudioFile(null);
        setAudioUrl(null);
        setWords(null);
        setErrorMessage("");
        setRecordingTime(0);
        audioChunksRef.current = [];

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    const handleAnalyze = async () => {
        if (!audioFile) {
            setErrorMessage("Please record or select an audio file first.");
            return;
        }

        const endpoint = import.meta.env.VITE_AUDIO_UPLOAD || "http://localhost:5000/api/upload";

        setIsAnalyzing(true);
        setErrorMessage("");
        setWords(null);

        try {
            const formData = new FormData();
            formData.append("audio", audioFile);

            const response = await axios.post(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data?.words && Array.isArray(response.data.words)) {
                setWords(response.data.words);
            } else {
                throw new Error("No prominent terms were detected from the recording.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to process audio file.";
            setErrorMessage(message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Native canvas to PNG download[cite: 1]
    const handleDownload = () => {
        if (!canvasRef.current) return;
        try {
            const imageUri = canvasRef.current.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = "mentorship-word-cloud.png";
            link.href = imageUri;
            link.click();
        } catch (err) {
            console.error("Failed to export PNG:", err);
            setErrorMessage("Failed to export word cloud image.");
        }
    };

    return (
        <main className="app-container">
            <div className="app-card">
                <header className="top-nav">


                    <h1 className="app-title">Session Word Cloud</h1>

                    <div className="daily-pill">
                        <svg className="leaf-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <circle cx="12" cy="12" r="6" />
                        </svg>
                        <span>{isRecording ? `Rec: ${formatTime(recordingTime)}` : "Ready"}</span>
                    </div>
                </header>

                {errorMessage && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        margin: '12px 20px 0',
                        fontSize: '0.875rem'
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <div className="workspace-grid">

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
                                {isRecording ? `Recording (${formatTime(recordingTime)})` : "Record Live"}
                            </span>
                        </div>

                        <p className="hint-text">
                            {isRecording
                                ? "Recording in progress. Click square to stop."
                                : "Click mic to start live capture (Max 10 min)"}
                        </p>
                    </section>


                    <section className="upload-section">
                        <h2 className="section-label">Or Upload Session Audio</h2>

                        <div
                            className="dropzone-box"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ cursor: 'pointer' }}
                        >
                            {audioUrl ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                                    <Music size={28} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 500, wordBreak: 'break-all', textAlign: 'center', padding: '0 8px' }}>
                                        {audioFile.name || "Microphone Recording.webm"}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                        Size: {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </span>
                                    <audio
                                        controls
                                        src={audioUrl}
                                        style={{ width: '90%', maxWidth: '320px', marginTop: '6px' }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                        Click container to replace file
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
                            <div className="action-row">
                                <button
                                    className="submit-btn"
                                    type="button"
                                    onClick={handleAnalyze}
                                    disabled={true}
                                >
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                                    </svg>
                                    <span>Record or Select Audio First</span>
                                </button>
                            </div>
                        ) : (
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
                                    disabled={isAnalyzing}
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
                                    disabled={isAnalyzing}
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
                                    <Square size={16} />
                                    <span>Discard</span>
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Word Cloud Result Section */}
                    <section className="upload-section" style={{ gridColumn: 'span 2', marginLeft: '5%', marginRight: '5%' }}>
                        <h2 className="section-label">Generated Word Cloud</h2>

                        <div
                            ref={canvasContainerRef}
                            className="dropzone-box"
                            style={{
                                minHeight: '320px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '12px',
                                background: '#ffffff',
                                overflow: 'hidden'
                            }}
                        >
                            {isAnalyzing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <Loader2 className="spinner" size={36} style={{ animation: 'spin 1s linear infinite' }} />
                                    <span>Transcribing audio & extracting topics with AI...</span>
                                </div>
                            ) : words && words.length > 0 ? (
                                <canvas
                                    ref={canvasRef}
                                    style={{ width: '100%', height: '320px', display: 'block' }}
                                />
                            ) : (
                                <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                                    Your generated word cloud will render here after analysis
                                </span>
                            )}
                        </div>

                        <div className="action-row">
                            <button
                                className="submit-btn"
                                type="button"
                                onClick={handleDownload}
                                disabled={!words || isAnalyzing}
                            >
                                <Download size={18} />
                                <span>Download Word Cloud (PNG)</span>
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
};

export default Audioinput;