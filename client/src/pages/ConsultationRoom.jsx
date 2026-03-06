import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { consultationAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ||
  (window.location.hostname === 'ansh1720.github.io'
    ? 'https://medisync-api-9043.onrender.com'
    : 'http://localhost:5000');

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

function ConsultationRoom() {
  const { consultationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Refs
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  // State
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const chatFileRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Doctor-only state for prescription
  const [showPrescription, setShowPrescription] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);

  const isDoctor = user?.role === 'doctor';

  // ─── Load consultation ───
  useEffect(() => {
    loadConsultation();
    return () => cleanup();
  }, [consultationId]);

  const loadConsultation = async () => {
    try {
      const res = await consultationAPI.getConsultation(consultationId);
      setConsultation(res.data.data);

      // Join the session
      await consultationAPI.joinConsultation(consultationId);

      // Start video
      await startMedia();
      connectSocket();
    } catch (err) {
      toast.error('Failed to load consultation');
      navigate('/consultation/history');
    } finally {
      setLoading(false);
    }
  };

  // ─── Media ───
  const startMedia = async () => {
    try {
      // Check if mediaDevices is available (requires HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('mediaDevices not available — likely non-HTTPS origin');
        toast.error('Camera/mic requires HTTPS or localhost. Video will be unavailable.');
        return;
      }

      // Mobile-friendly constraints: use facingMode for front camera, lower resolution for performance
      const constraints = {
        video: {
          facingMode: 'user',       // Front camera on mobile
          width: { ideal: 640 },    // Reasonable for mobile
          height: { ideal: 480 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      // Attach to video element immediately and force play (needed on mobile)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Mobile browsers sometimes need explicit play()
        try { await localVideoRef.current.play(); } catch (_) {}
      }
    } catch (err) {
      console.error('Media error:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Please allow camera & microphone access in your browser settings');
      } else if (err.name === 'NotFoundError') {
        toast.error('No camera or microphone found on this device');
      } else if (err.name === 'OverconstrainedError') {
        // Fallback: try without specific constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = fallbackStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = fallbackStream;
            try { await localVideoRef.current.play(); } catch (_) {}
          }
        } catch (fallbackErr) {
          toast.error('Could not access camera: ' + fallbackErr.message);
        }
      } else {
        toast.error('Could not access camera/microphone: ' + err.message);
      }
    }
  };

  // Re-attach local stream when video ref becomes available
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      // Force play on mobile browsers
      localVideoRef.current.play().catch(() => {});
    }
  });

  // ─── Socket.IO + WebRTC ───
  const connectSocket = useCallback(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_consultation', {
        consultationId,
        userId: user?.userId || user?._id,
        role: user?.role,
        name: user?.name
      });
    });

    // When the other person joins
    socket.on('user_joined_consultation', ({ userId, name, role }) => {
      toast.success(`${name} joined the consultation`);
      setRemoteConnected(true);
      // Initiator creates the offer
      createOffer();
    });

    // Receive offer
    socket.on('call_offer', async ({ signal }) => {
      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call_answer', { consultationId, signal: answer });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    // Receive answer
    socket.on('call_answer', async ({ signal }) => {
      try {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        }
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    });

    // ICE candidates
    socket.on('ice_candidate', async ({ candidate }) => {
      try {
        if (pcRef.current && candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('ICE error:', err);
      }
    });

    // Chat
    socket.on('chat_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // Call ended by other party
    socket.on('call_ended', () => {
      toast('Call ended by the other participant');
      setCallEnded(true);
      cleanupMedia();
    });

    socket.on('user_left_consultation', ({ name }) => {
      toast(`${name} left the consultation`);
      setRemoteConnected(false);
    });

    socket.on('disconnect', () => setConnected(false));
  }, [consultationId, user]);

  // ─── WebRTC Peer Connection ───
  const createPeerConnection = () => {
    if (pcRef.current) pcRef.current.close();

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        // Force play on mobile browsers
        remoteVideoRef.current.play().catch(() => {});
        setRemoteConnected(true);
      }
    };

    // Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice_candidate', { consultationId, candidate: event.candidate });
      }
    };

    return pc;
  };

  const createOffer = async () => {
    try {
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('call_offer', {
        consultationId,
        signal: offer,
        from: user?.userId || user?._id,
        name: user?.name
      });
    } catch (err) {
      console.error('Create offer error:', err);
    }
  };

  // ─── Controls ───
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(prev => !prev);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsVideoOff(prev => !prev);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;
    const msg = {
      id: Date.now(),
      text: newMessage.trim(),
      senderName: user?.name,
      senderId: user?.userId || user?._id,
      timestamp: new Date().toISOString()
    };
    socketRef.current.emit('chat_message', { consultationId, message: msg });
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  const sendFile = async (file) => {
    if (!file || !socketRef.current) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB.');
      return;
    }
    setUploadingFile(true);
    try {
      // Upload to server
      const formData = new FormData();
      formData.append('files', file);
      const res = await consultationAPI.uploadDocuments(consultationId, formData);
      const uploaded = res.data?.data?.[0];

      // Send file info via chat socket
      const msg = {
        id: Date.now(),
        text: '',
        senderName: user?.name,
        senderId: user?.userId || user?._id,
        timestamp: new Date().toISOString(),
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
          url: uploaded?.url || null
        }
      };
      socketRef.current.emit('chat_message', { consultationId, message: msg });
      setMessages(prev => [...prev, msg]);
      toast.success(`Sent: ${file.name}`);
    } catch (err) {
      console.error('File send error:', err);
      toast.error('Failed to send file');
    } finally {
      setUploadingFile(false);
      if (chatFileRef.current) chatFileRef.current.value = '';
    }
  };

  const endCall = async () => {
    socketRef.current?.emit('end_call', { consultationId });
    cleanupMedia();
    setCallEnded(true);
    toast.success('Call ended');

    // If patient ends the call, auto-complete on their side (doctor will complete from their end)
    // No status change here — doctor completes via prescription form or skip
  };

  // ─── Doctor: Complete consultation with prescription ───
  const handleComplete = async () => {
    try {
      const validMeds = medications.filter(m => m.name.trim() && m.dosage.trim());
      await consultationAPI.completeConsultation(consultationId, {
        diagnosis,
        doctorNotes,
        followUpRequired,
        prescription: validMeds.length > 0 ? { medications: validMeds, generalInstructions } : undefined
      });
      toast.success('Consultation completed & prescription saved');
      navigate('/doctor-dashboard');
    } catch (err) {
      toast.error('Failed to complete consultation');
    }
  };

  const addMedication = () => {
    setMedications(prev => [...prev, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const updateMedication = (index, field, value) => {
    setMedications(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const removeMedication = (index) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Cleanup ───
  const cleanupMedia = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    pcRef.current?.close();
    pcRef.current = null;
  };

  const cleanup = () => {
    cleanupMedia();
    socketRef.current?.disconnect();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Connecting to consultation room...</p>
        </div>
      </div>
    );
  }

  // ─── Post-call: Doctor prescription form ───
  if (callEnded && isDoctor && !showPrescription) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-4">Call Ended</h2>
          <p className="text-gray-300 mb-6">Would you like to write a prescription and complete this consultation?</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowPrescription(true)} className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
              Write Prescription
            </button>
            <button onClick={async () => {
              try {
                await consultationAPI.completeConsultation(consultationId, { diagnosis: '', doctorNotes: 'Consultation completed without prescription' });
              } catch (e) { /* ignore */ }
              navigate('/doctor-dashboard');
            }} className="px-6 py-2.5 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition">
              Skip & Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Post-call: prescription form ───
  if (showPrescription && isDoctor) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Complete Consultation</h2>

          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Diagnosis</label>
              <textarea rows={2} value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground resize-none" placeholder="Primary diagnosis..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
              <textarea rows={3} value={doctorNotes} onChange={e => setDoctorNotes(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground resize-none" placeholder="Consultation notes..." />
            </div>

            {/* Medications */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Prescription</label>
                <button onClick={addMedication} className="text-sm text-primary hover:underline">+ Add Medication</button>
              </div>
              {medications.map((med, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2 p-3 bg-muted rounded-lg">
                  <input placeholder="Medicine name" value={med.name} onChange={e => updateMedication(i, 'name', e.target.value)}
                    className="px-2 py-1.5 rounded border border-border bg-background text-foreground text-sm" />
                  <input placeholder="Dosage" value={med.dosage} onChange={e => updateMedication(i, 'dosage', e.target.value)}
                    className="px-2 py-1.5 rounded border border-border bg-background text-foreground text-sm" />
                  <input placeholder="Frequency" value={med.frequency} onChange={e => updateMedication(i, 'frequency', e.target.value)}
                    className="px-2 py-1.5 rounded border border-border bg-background text-foreground text-sm" />
                  <input placeholder="Duration" value={med.duration} onChange={e => updateMedication(i, 'duration', e.target.value)}
                    className="px-2 py-1.5 rounded border border-border bg-background text-foreground text-sm" />
                  <div className="flex gap-1">
                    <input placeholder="Instructions" value={med.instructions} onChange={e => updateMedication(i, 'instructions', e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded border border-border bg-background text-foreground text-sm" />
                    {medications.length > 1 && (
                      <button onClick={() => removeMedication(i)} className="px-2 text-red-500 hover:text-red-700">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">General Instructions</label>
              <textarea rows={2} value={generalInstructions} onChange={e => setGeneralInstructions(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground resize-none" placeholder="Rest, diet, lifestyle advice..." />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="followUp" checked={followUpRequired} onChange={e => setFollowUpRequired(e.target.checked)}
                className="rounded border-border" />
              <label htmlFor="followUp" className="text-sm text-foreground">Follow-up required</label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button onClick={() => navigate('/doctor-dashboard')} className="px-6 py-2.5 border border-border rounded-lg text-foreground hover:bg-accent transition">
                Cancel
              </button>
              <button onClick={handleComplete} className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
                Complete & Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Post-call: Patient view ───
  if (callEnded && !isDoctor) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-4">Consultation Ended</h2>
          <p className="text-gray-300 mb-6">Your consultation has ended. You can view your prescription and consultation details in your history.</p>
          <button onClick={() => navigate('/consultation/history')} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            View History
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Video UI ───
  return (
    <div className="h-dvh max-h-dvh bg-gray-900 flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      {/* Top bar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-white font-medium text-sm">
            {isDoctor
              ? `Patient: ${consultation?.userId?.name || 'Patient'}`
              : `Dr. ${consultation?.doctorId?.name || 'Doctor'}`}
          </span>
        </div>
        <div className="text-gray-400 text-sm">
          {remoteConnected ? '🟢 Connected' : '⏳ Waiting...'}
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {/* Remote video (large) */}
        <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />

        {!remoteConnected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👨‍⚕️</span>
              </div>
              <p className="text-gray-300 text-lg">Waiting for the other participant to join...</p>
            </div>
          </div>
        )}

        {/* Local video (small overlay) */}
        <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-gray-600 shadow-lg">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Camera Off</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-center gap-4 flex-shrink-0">
        <button onClick={toggleMute}
          className={`p-3 rounded-full transition ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
          title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? '🔇' : '🎤'}
        </button>
        <button onClick={toggleVideo}
          className={`p-3 rounded-full transition ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}>
          {isVideoOff ? '📷' : '🎥'}
        </button>
        <button onClick={() => setShowChat(!showChat)}
          className="p-3 rounded-full bg-gray-600 text-white hover:bg-gray-500 transition" title="Chat">
          💬
        </button>
        <button onClick={endCall}
          className="px-6 py-3 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition" title="End call">
          End Call
        </button>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="absolute right-0 top-12 bottom-16 w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <span className="text-white font-medium">Chat</span>
            <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === (user?.userId || user?._id) ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  msg.senderId === (user?.userId || user?._id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200'
                }`}>
                  <p className="text-xs opacity-70 mb-1">{msg.senderName}</p>
                  {msg.file ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{msg.file.type?.startsWith('image/') ? '🖼️' : '📄'}</span>
                        <span className="truncate">{msg.file.name}</span>
                      </div>
                      <p className="text-xs opacity-70">{(msg.file.size / 1024).toFixed(0)} KB</p>
                      {msg.file.url && msg.file.type?.startsWith('image/') && (
                        <img src={msg.file.url} alt={msg.file.name} className="max-w-full rounded mt-1 cursor-pointer"
                          onClick={() => window.open(msg.file.url, '_blank')} />
                      )}
                      {msg.file.url && !msg.file.type?.startsWith('image/') && (
                        <a href={msg.file.url} download={msg.file.name}
                          className="inline-block mt-1 px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition">
                          Download
                        </a>
                      )}
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-700 flex gap-2">
            <input
              ref={chatFileRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => { if (e.target.files[0]) sendFile(e.target.files[0]); }}
            />
            <button
              onClick={() => chatFileRef.current?.click()}
              disabled={uploadingFile}
              className="px-2 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 disabled:opacity-50 flex-shrink-0"
              title="Attach file">
              {uploadingFile ? '⏳' : '📎'}
            </button>
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-white text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <button onClick={sendMessage} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsultationRoom;
