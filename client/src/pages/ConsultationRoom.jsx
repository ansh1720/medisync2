import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { consultationAPI } from '../utils/api';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import toast from 'react-hot-toast';
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  DocumentTextIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneSolidIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'ansh1720.github.io'
    ? 'https://medisync-api-9043.onrender.com'
    : 'http://localhost:5000');

function ConsultationRoom() {
  const { consultationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const chatEndRef = useRef(null);

  // State
  const [consultation, setConsultation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);
  const [remoteUserName, setRemoteUserName] = useState('');
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Load consultation details
  useEffect(() => {
    loadConsultation();
  }, [consultationId]);

  // Set up Socket.IO connection
  useEffect(() => {
    if (!consultation || !user) return;

    const token = localStorage.getItem('medisync_token');
    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      // Join the consultation room
      socket.emit('join_consultation', {
        consultationId,
        userId: user._id || user.id,
        role: user.role,
        name: user.name,
      });
    });

    socket.on('user_joined_consultation', ({ userId, name, role }) => {
      console.log(`${name} joined the consultation`);
      setRemoteUserName(name);
      setIsRemoteConnected(true);
      toast.success(`${name} has joined the consultation`);
    });

    socket.on('user_left_consultation', ({ name }) => {
      setIsRemoteConnected(false);
      toast(`${name} has left the consultation`, { icon: '👋' });
    });

    // WebRTC signaling
    socket.on('call_offer', ({ signal, from, name }) => {
      console.log('Received call offer from', name);
      setRemoteUserName(name);
      answerCall(signal);
    });

    socket.on('call_answer', ({ signal }) => {
      console.log('Received call answer');
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    });

    socket.on('ice_candidate', ({ candidate }) => {
      if (peerRef.current) {
        peerRef.current.signal(candidate);
      }
    });

    // Chat messages
    socket.on('chat_message', (message) => {
      setMessages((prev) => [...prev, message]);
      if (!isChatOpen) {
        setUnreadMessages((prev) => prev + 1);
      }
    });

    socket.on('call_ended', () => {
      toast('The other participant has ended the call', { icon: '📞' });
      cleanupCall();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.emit('leave_consultation', { consultationId });
      socket.disconnect();
      cleanupCall();
    };
  }, [consultation, user]);

  // Call duration timer
  useEffect(() => {
    let interval;
    if (callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStartTime]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConsultation = async () => {
    try {
      setIsLoading(true);
      const response = await consultationAPI.joinConsultation(consultationId);
      if (response.data.success) {
        setConsultation(response.data.data);
      }
    } catch (error) {
      console.error('Error loading consultation:', error);
      toast.error(error.response?.data?.message || 'Failed to load consultation');
      navigate('/consultations');
    } finally {
      setIsLoading(false);
    }
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ],
        },
      });

      peer.on('signal', (signal) => {
        socketRef.current?.emit('call_offer', {
          consultationId,
          signal,
          from: user._id || user.id,
          name: user.name,
        });
      });

      peer.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on('connect', () => {
        setIsCallActive(true);
        setCallStartTime(Date.now());
        toast.success('Call connected!');
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        toast.error('Connection error. Please try again.');
      });

      peer.on('close', () => {
        cleanupCall();
      });

      peerRef.current = peer;
      setIsCallActive(true);
      setCallStartTime(Date.now());
    } catch (error) {
      console.error('Error starting call:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Please allow camera and microphone access');
      } else {
        toast.error('Failed to start video call');
      }
    }
  };

  const answerCall = async (incomingSignal) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ],
        },
      });

      peer.on('signal', (signal) => {
        socketRef.current?.emit('call_answer', {
          consultationId,
          signal,
        });
      });

      peer.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on('connect', () => {
        setIsCallActive(true);
        setCallStartTime(Date.now());
        toast.success('Call connected!');
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
      });

      peer.on('close', () => {
        cleanupCall();
      });

      peer.signal(incomingSignal);
      peerRef.current = peer;
      setIsCallActive(true);
    } catch (error) {
      console.error('Error answering call:', error);
      toast.error('Failed to join video call');
    }
  };

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsCallActive(false);
    setCallStartTime(null);
    setCallDuration(0);
    setIsScreenSharing(false);
  };

  const endCall = () => {
    socketRef.current?.emit('end_call', { consultationId });
    cleanupCall();
    toast.success('Call ended');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing, revert to camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoTrack = stream.getVideoTracks()[0];
      
      if (peerRef.current) {
        const sender = peerRef.current._pc
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      }

      localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
      localStreamRef.current.addTrack(videoTrack);

      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (peerRef.current) {
          const sender = peerRef.current._pc
            ?.getSenders()
            .find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
        localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
        localStreamRef.current.addTrack(screenTrack);

        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Screen share error:', error);
        toast.error('Failed to share screen');
      }
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      text: newMessage.trim(),
      sender: user._id || user.id,
      senderName: user.name,
      senderRole: user.role,
      timestamp: new Date().toISOString(),
    };

    socketRef.current?.emit('chat_message', {
      consultationId,
      message,
    });

    setMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEndConsultation = async () => {
    if (window.confirm('Are you sure you want to end this consultation?')) {
      endCall();
      try {
        await consultationAPI.completeConsultation(consultationId, { notes });
        toast.success('Consultation completed successfully');
      } catch (error) {
        console.error('Error completing consultation:', error);
      }
      navigate(user.role === 'doctor' ? '/doctor-dashboard' : '/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Joining consultation room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-white font-medium text-sm">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
          {isRemoteConnected && (
            <span className="text-green-400 text-sm flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              {remoteUserName || 'Participant'} is in the room
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {callStartTime && (
            <div className="flex items-center text-gray-300 text-sm">
              <ClockIcon className="h-4 w-4 mr-1" />
              {formatDuration(callDuration)}
            </div>
          )}
          <button
            onClick={handleEndConsultation}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            End Consultation
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className={`flex-1 flex flex-col ${isChatOpen ? 'mr-80' : ''} transition-all duration-300`}>
          {/* Video Grid */}
          <div className="flex-1 p-4 flex items-center justify-center relative">
            {isCallActive ? (
              <>
                {/* Remote Video (Large) */}
                <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-800 relative">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!isRemoteConnected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-24 w-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <UserIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <p className="text-gray-400 text-lg">Waiting for participant to join...</p>
                      </div>
                    </div>
                  )}
                  {isRemoteConnected && (
                    <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg">
                      <span className="text-white text-sm">{remoteUserName}</span>
                    </div>
                  )}
                </div>

                {/* Local Video (PiP) */}
                <div className="absolute bottom-8 right-8 w-48 h-36 rounded-xl overflow-hidden border-2 border-gray-600 shadow-lg bg-gray-800">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isVideoOff && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-2 bg-black/50 px-2 py-0.5 rounded text-xs text-white">
                    You
                  </div>
                </div>
              </>
            ) : (
              /* Pre-call screen */
              <div className="text-center">
                <div className="h-32 w-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <VideoCameraIcon className="h-16 w-16 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Ready to Start</h2>
                <p className="text-gray-400 mb-2">
                  {consultation?.consultation?.consultationType === 'chat' 
                    ? 'Start a chat consultation' 
                    : 'Start a video consultation'}
                </p>
                {isRemoteConnected && (
                  <p className="text-green-400 mb-4">
                    {remoteUserName} is waiting in the room
                  </p>
                )}
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={startCall}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl text-lg font-medium flex items-center transition-colors"
                  >
                    <VideoCameraIcon className="h-6 w-6 mr-2" />
                    Start Video Call
                  </button>
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg font-medium flex items-center transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2" />
                    Chat Only
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
            <div className="flex items-center justify-center space-x-4">
              {/* Mute */}
              <button
                onClick={toggleMute}
                disabled={!isCallActive}
                className={`p-4 rounded-full transition-colors ${
                  isMuted
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                } ${!isCallActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <MicrophoneSolidIcon className="h-6 w-6" />
                ) : (
                  <MicrophoneIcon className="h-6 w-6" />
                )}
              </button>

              {/* Video Toggle */}
              <button
                onClick={toggleVideo}
                disabled={!isCallActive}
                className={`p-4 rounded-full transition-colors ${
                  isVideoOff
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                } ${!isCallActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isVideoOff ? (
                  <VideoCameraSlashIcon className="h-6 w-6" />
                ) : (
                  <VideoCameraIcon className="h-6 w-6" />
                )}
              </button>

              {/* Screen Share */}
              <button
                onClick={toggleScreenShare}
                disabled={!isCallActive}
                className={`p-4 rounded-full transition-colors ${
                  isScreenSharing
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                } ${!isCallActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              >
                <ComputerDesktopIcon className="h-6 w-6" />
              </button>

              {/* Chat Toggle */}
              <button
                onClick={() => {
                  setIsChatOpen(!isChatOpen);
                  if (!isChatOpen) setUnreadMessages(0);
                }}
                className={`p-4 rounded-full transition-colors relative ${
                  isChatOpen
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title="Toggle chat"
              >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </button>

              {/* Notes (Doctor only) */}
              {user?.role === 'doctor' && (
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className={`p-4 rounded-full transition-colors ${
                    showNotes
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                  title="Consultation notes"
                >
                  <DocumentTextIcon className="h-6 w-6" />
                </button>
              )}

              {/* End Call */}
              <button
                onClick={isCallActive ? endCall : handleEndConsultation}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                title="End call"
              >
                <PhoneXMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col absolute right-0 top-14 bottom-0 z-10">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-medium">Chat</h3>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <ChatBubbleLeftRightIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Start the conversation</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender === (user._id || user.id);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-200'
                        }`}
                      >
                        {!isOwn && (
                          <p className="text-xs font-medium text-blue-300 mb-1">
                            {msg.senderRole === 'doctor' ? 'Dr. ' : ''}
                            {msg.senderName}
                          </p>
                        )}
                        <p className="text-sm break-words">{msg.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-blue-200' : 'text-gray-400'
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Doctor Notes Sidebar */}
        {showNotes && user?.role === 'doctor' && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col absolute right-0 top-14 bottom-0 z-10">
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-medium">Consultation Notes</h3>
              <button
                onClick={() => setShowNotes(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type your consultation notes here... These will be saved when you end the consultation."
                className="w-full h-full bg-gray-700 text-white placeholder-gray-400 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConsultationRoom;
