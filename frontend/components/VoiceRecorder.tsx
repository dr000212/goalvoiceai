"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { api } from "@/lib/api";

export function VoiceRecorder({ onTranscript }: { onTranscript: (text: string) => void }) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [levels, setLevels] = useState<number[]>(Array(18).fill(8));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function stopVisualizer() {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    setLevels(Array(18).fill(8));
  }

  function startVisualizer(stream: MediaStream) {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    const data = new Uint8Array(analyser.frequencyBinCount);

    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.72;
    source.connect(analyser);
    audioContextRef.current = audioContext;

    function tick() {
      analyser.getByteFrequencyData(data);
      const barCount = 18;
      const bucketSize = Math.max(1, Math.floor(data.length / barCount));
      const next = Array.from({ length: barCount }, (_, index) => {
        const start = index * bucketSize;
        const bucket = data.slice(start, start + bucketSize);
        const average = bucket.reduce((total, value) => total + value, 0) / bucket.length;
        return Math.max(8, Math.min(56, 8 + (average / 255) * 54));
      });
      setLevels(next);
      animationRef.current = requestAnimationFrame(tick);
    }

    tick();
  }

  useEffect(() => () => {
    stopVisualizer();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = async () => {
        setBusy(true);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 512) {
          setError("Recording is too short. Try speaking for a few seconds.");
          setBusy(false);
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          stopVisualizer();
          return;
        }
        const formData = new FormData();
        formData.append("audio", blob, "check-in.webm");
        try {
          const response = await api.post<{ transcript: string }>("/check-ins/voice", formData);
          onTranscript(response.transcript);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed.");
        } finally {
          setBusy(false);
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          stopVisualizer();
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      startVisualizer(stream);
      setRecording(true);
    } catch {
      setError("Microphone permission was denied or unavailable.");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="card p-5">
      <div className="grid justify-items-center gap-5">
        <div className={`flex h-24 w-full max-w-md items-center justify-center gap-2 rounded-3xl border border-leaf/10 bg-[#f5f4ef] px-5 shadow-inner ${recording ? "opacity-100" : "opacity-60"}`}>
          {levels.map((level, index) => (
            <span
              key={index}
              className={`w-2 rounded-full transition-all duration-75 ${recording ? "bg-leaf" : "bg-ink/20"}`}
              style={{ height: `${recording ? level : 10 + (index % 3) * 4}px` }}
            />
          ))}
        </div>
        {!recording ? (
          <button className="btn btn-secondary min-w-52" onClick={start} disabled={busy} type="button">
            <Mic className="h-4 w-4" aria-hidden /> Start recording
          </button>
        ) : (
          <button className="btn btn-primary min-w-52" onClick={stop} type="button">
            <Square className="h-4 w-4" aria-hidden /> Stop recording
          </button>
        )}
        {busy && <span className="text-sm font-semibold text-ink/60">Transcribing...</span>}
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-coral">{error}</p>}
    </div>
  );
}
