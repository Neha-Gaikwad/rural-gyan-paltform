import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, Phone, 
  MessageSquare, Users, X, Send,
  Clock, CheckCircle, XCircle, Subtitles, Volume2, VolumeX, Presentation, Hand
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Whiteboard from './Whiteboard';

const VideoCard = ({ peer, isLocal, stream, userName }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (peer) {
      peer.on('stream', (remoteStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
        }
      });
    } else if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [peer, stream]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-cyan-900/30 shadow-lg group aspect-video">
      <video
        playsInline
        autoPlay
        muted={isLocal}
        ref={videoRef}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-cyan-500/30">
        <span className="text-white text-sm font-medium flex items-center gap-2">
          {isLocal ? 'YOU' : userName}
          {isLocal && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>}
        </span>
      </div>
      <div className="absolute inset-0 border-2 border-cyan-500/0 group-hover:border-cyan-500/50 transition-all duration-300 pointer-events-none rounded-lg" />
    </div>
  );
};

const VirtualClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [classData, setClassData] = useState(null);
  const [timer, setTimer] = useState('00:00:00');
  const [startTime] = useState(Date.now());
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [captionLanguage, setCaptionLanguage] = useState('en-IN');
  const captionTimeoutRef = useRef(null);
  const [raisedHands, setRaisedHands] = useState([]);
  const [isHandRaised, setIsHandRaised] = useState(false);

  const translateText = async (text, targetLang) => {
    if (targetLang === 'en-IN') return text;
    try {
      // Try multiple translation endpoints
      // Method 1: Google Translate (free endpoint)
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const translated = data[0]?.[0]?.[0];
        if (translated && translated !== text) {
          return translated;
        }
      }
      
      // Method 2: Fallback to LibreTranslate (if available)
      const libreResponse = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: 'hi',
          format: 'text'
        })
      });
      
      if (libreResponse.ok) {
        const libreData = await libreResponse.json();
        return libreData.translatedText || text;
      }
      
      return text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };
  
  const socketRef = useRef();
  const peersRef = useRef([]);
  const userVideo = useRef();
  const screenTrackRef = useRef();
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setTimer(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    fetchClassData();
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream;
        }

        socketRef.current.emit('join-virtual-class', {
          classId,
          userId: user._id,
          userType: user.role,
          userName: user.fullName
        });

        // Handle existing participants (when joining a room with people already in it)
        socketRef.current.on('existing-participants', (participants) => {
          console.log('🟣 Existing participants:', participants);
          participants.forEach(participant => {
            const peer = createPeer(participant.socketId, socketRef.current.id, currentStream);
            peersRef.current.push({
              peerID: participant.socketId,
              peer,
              userName: participant.userName || 'Unknown User',
              userId: participant.userId,
              userType: participant.userType
            });
            setPeers((users) => [...users, { 
              peer, 
              userName: participant.userName || 'Unknown User', 
              peerID: participant.socketId,
              userId: participant.userId,
              userType: participant.userType
            }]);
          });
        });

        // Existing users receive this when a new user joins
        socketRef.current.on('participant-joined', (payload) => {
          console.log('🟢 Participant joined:', payload);
          const peer = createPeer(payload.socketId, socketRef.current.id, currentStream);
          peersRef.current.push({
            peerID: payload.socketId,
            peer,
            userName: payload.userName || 'Unknown User',
            userId: payload.userId,
            userType: payload.userType
          });
          setPeers((users) => [...users, { 
            peer, 
            userName: payload.userName || 'Unknown User', 
            peerID: payload.socketId,
            userId: payload.userId,
            userType: payload.userType
          }]);
          toast.success(`${payload.userName} joined`);
        });

        // New user receives this when an existing user offers a connection
        socketRef.current.on('video-offer', (payload) => {
          console.log('🔵 Video offer received:', payload);
          const peer = addPeer(payload.offer, payload.fromSocketId, currentStream);
          peersRef.current.push({
            peerID: payload.fromSocketId,
            peer,
            userName: payload.userName || 'Connecting...',
            userId: payload.fromUserId,
            userType: payload.userType || 'participant'
          });
          setPeers((users) => [...users, { 
            peer, 
            userName: payload.userName || 'Connecting...',
            peerID: payload.fromSocketId,
            userId: payload.fromUserId,
            userType: payload.userType || 'participant'
          }]);
        });

        socketRef.current.on('video-answer', (payload) => {
          console.log('🟡 Video answer received:', payload);
          const item = peersRef.current.find((p) => p.peerID === payload.fromSocketId);
          if (item) {
            item.peer.signal(payload.answer);
          }
        });

        socketRef.current.on('ice-candidate', (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.fromSocketId);
          if (item) {
            item.peer.signal(payload.candidate);
          }
        });

        socketRef.current.on('chat-message', (message) => {
          setMessages((msgs) => [...msgs, message]);
        });

        socketRef.current.on('caption-update', (data) => {
          if (data.userId !== user._id) {
            translateText(data.caption, captionLanguage).then(translated => {
              setCurrentCaption(translated);
              
              if (captionTimeoutRef.current) {
                clearTimeout(captionTimeoutRef.current);
              }
              
              captionTimeoutRef.current = setTimeout(() => {
                setCurrentCaption('');
              }, 5000);
            });
          }
        });

        // Listen for class ended event
        socketRef.current.on('class-ended', () => {
          toast.error('Class has been ended by teacher');
          if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
          }
          const dashboardPath = user.role === 'teacher' ? '/teacher/dashboard' : 
                               user.role === 'student' ? '/student/dashboard' : 
                               '/dashboard';
          setTimeout(() => navigate(dashboardPath), 2000);
        });

        // Listen for teacher controls
        socketRef.current.on('force-mute', () => {
          if (currentStream) {
            currentStream.getAudioTracks()[0].enabled = false;
            setIsAudioEnabled(false);
            toast.error('Teacher muted your microphone');
          }
        });

        socketRef.current.on('force-video-off', () => {
          if (currentStream) {
            currentStream.getVideoTracks()[0].enabled = false;
            setIsVideoEnabled(false);
            toast.error('Teacher turned off your camera');
          }
        });

        // Raise hand events
        socketRef.current.on('hand-raised', (data) => {
          setRaisedHands(prev => [...prev, data]);
          if (user.role === 'teacher') {
            toast(`✋ ${data.userName} raised their hand`, { icon: '✋' });
          }
        });

        socketRef.current.on('hand-lowered', (data) => {
          setRaisedHands(prev => prev.filter(h => h.userId !== data.userId));
        });

        socketRef.current.on('all-hands-lowered', () => {
          setRaisedHands([]);
          setIsHandRaised(false);
        });
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
        toast.error("Could not access camera/microphone");
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = captionLanguage;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const caption = finalTranscript || interimTranscript;
        setCurrentCaption(caption);
        
        // Clear previous timeout
        if (captionTimeoutRef.current) {
          clearTimeout(captionTimeoutRef.current);
        }
        
        // Auto-clear caption after 5 seconds of no speech
        captionTimeoutRef.current = setTimeout(() => {
          setCurrentCaption('');
        }, 5000);
        
        if (finalTranscript) {
          socketRef.current?.emit('caption-update', {
            classId,
            caption: finalTranscript,
            userId: user._id,
            userName: user.fullName
          });
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          setCurrentCaption('');
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [captionLanguage, classId, user._id, user.fullName]);

  useEffect(() => {
    if (captionsEnabled && recognitionRef.current) {
      recognitionRef.current.lang = captionLanguage;
      recognitionRef.current.start();
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
      setCurrentCaption('');
    }
  }, [captionsEnabled, captionLanguage]);

  const fetchClassData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/virtual-class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setClassData(data.data);
      }
    } catch (error) {
      console.error('Error fetching class data:', error);
    }
  };

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (signal) => {
      if (signal.type === 'offer') {
        socketRef.current.emit('video-offer', { offer: signal, targetSocketId: userToSignal });
      } else if (signal.candidate) {
        socketRef.current.emit('ice-candidate', { candidate: signal, targetSocketId: userToSignal });
      }
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (signal) => {
      if (signal.type === 'answer') {
        socketRef.current.emit('video-answer', { answer: signal, targetSocketId: callerID });
      } else if (signal.candidate) {
        socketRef.current.emit('ice-candidate', { candidate: signal, targetSocketId: callerID });
      }
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !isAudioEnabled;
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !isVideoEnabled;
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen share and switch back to camera
      try {
        screenTrackRef.current.stop();
        
        // Get camera stream again
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoTrack = cameraStream.getVideoTracks()[0];
        
        // Replace track in local stream
        const oldTrack = stream.getVideoTracks()[0];
        stream.removeTrack(oldTrack);
        stream.addTrack(videoTrack);
        
        // Update local video
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }
        
        // Replace track in all peer connections
        peersRef.current.forEach(({ peer }) => {
          const sender = peer._pc?.getSenders()?.find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
        
        // Notify others
        socketRef.current.emit('stop-screen-share', { classId });
        toast.success('Screen sharing stopped');
        setIsScreenSharing(false);
      } catch (err) {
        console.error('Error stopping screen share:', err);
        toast.error('Failed to stop screen sharing');
      }
    } else {
      // Start screen share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { cursor: 'always' },
          audio: false
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;
        
        // Replace track in local stream
        const oldTrack = stream.getVideoTracks()[0];
        stream.removeTrack(oldTrack);
        stream.addTrack(screenTrack);
        
        // Update local video
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }
        
        // Replace track in all peer connections
        peersRef.current.forEach(({ peer }) => {
          const sender = peer._pc?.getSenders()?.find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });
        
        // Handle when user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare(); // This will switch back to camera
        };
        
        // Notify others
        socketRef.current.emit('start-screen-share', { 
          classId,
          userId: user._id,
          userName: user.fullName
        });
        
        toast.success('Screen sharing started');
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error sharing screen:', err);
        if (err.name === 'NotAllowedError') {
          toast.error('Screen sharing permission denied');
        } else {
          toast.error('Failed to start screen sharing');
        }
      }
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const messageData = {
        classId,
        message: newMessage,
        sender: user.role,
        userName: user.fullName,
        userId: user._id,
        timestamp: new Date()
      };
      
      console.log('Sending message with userId:', user._id, 'Full data:', messageData);
      socketRef.current.emit('chat-message', messageData);
      // Don't add locally - wait for server broadcast
      setNewMessage('');
    }
  };

  const leaveClass = () => {
    if (window.confirm("Are you sure you want to leave the class?")) {
      // Stop all media tracks
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.emit('leave-virtual-class', classId);
        socketRef.current.disconnect();
      }
      
      // Navigate based on user role
      const dashboardPath = user.role === 'teacher' ? '/teacher/dashboard' : 
                           user.role === 'student' ? '/student/dashboard' : 
                           '/dashboard';
      navigate(dashboardPath);
    }
  };

  const markAttendance = async (studentId, isPresent) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/virtual-class/${classId}/attendance/mark`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ studentId, isPresent })
      });
      
      if (response.ok) {
        toast.success(`Attendance marked: ${isPresent ? 'Present' : 'Absent'}`);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const muteStudent = (studentSocketId) => {
    socketRef.current.emit('teacher-mute-student', { targetSocketId: studentSocketId, classId });
    toast.success('Student muted');
  };

  const turnOffStudentVideo = (studentSocketId) => {
    socketRef.current.emit('teacher-video-off-student', { targetSocketId: studentSocketId, classId });
    toast.success('Student camera turned off');
  };

  const toggleRaiseHand = () => {
    if (isHandRaised) {
      socketRef.current.emit('lower-hand', { classId, userId: user._id });
      setIsHandRaised(false);
      toast.success('Hand lowered');
    } else {
      socketRef.current.emit('raise-hand', { classId, userId: user._id, userName: user.fullName });
      setIsHandRaised(true);
      toast.success('Hand raised');
    }
  };

  const lowerAllHands = () => {
    socketRef.current.emit('lower-all-hands', { classId });
    setRaisedHands([]);
    toast.success('All hands lowered');
  };

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden cyber-bg">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-cyan-400 cyber-glitch-text" data-text={classData?.title || "VIRTUAL_CLASSROOM"}>
                {classData?.title || "VIRTUAL_CLASSROOM"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-cyan-600 font-mono">SECURE_CONNECTION_ESTABLISHED</span>
                <span className="text-xs text-gray-500 font-mono">|</span>
                <div className="flex items-center gap-1 text-xs text-purple-400 font-mono">
                  <Clock size={12} />
                  {timer}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-400 text-xs rounded animate-pulse">LIVE</span>
              <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-xs rounded">{peers.length + 1} ONLINE</span>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar pt-20 pb-24">
          {user.role === 'student' ? (
            // Student view: Teacher video large, others small
            <div className="flex flex-col gap-4 h-full">
              {/* Teacher's large video */}
              {peers.find(p => p.userType === 'teacher') ? (
                <div className="flex-1 relative">
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)] h-full w-full">
                    <video
                      playsInline
                      autoPlay
                      ref={(ref) => {
                        if (ref) {
                          const teacherPeer = peers.find(p => p.userType === 'teacher');
                          if (teacherPeer?.peer) {
                            teacherPeer.peer.on('stream', (remoteStream) => {
                              ref.srcObject = remoteStream;
                            });
                          }
                        }
                      }}
                      className="w-full h-full object-contain bg-black"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-cyan-500/50 z-10">
                      <span className="text-white text-lg font-bold flex items-center gap-2">
                        👨‍🏫 {peers.find(p => p.userType === 'teacher')?.userName || 'Teacher'}
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"/>
                      </span>
                    </div>
                    {captionsEnabled && currentCaption && (
                      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-[90%] bg-black/90 backdrop-blur-md px-6 py-3 rounded-lg border border-green-500/50 shadow-lg z-10">
                        <p className="text-white text-center font-medium">{currentCaption}</p>
                      </div>
                    )}
                  </div>
                  {captionsEnabled && (
                    <div className="absolute top-2 right-2 z-20">
                      <select
                        value={captionLanguage}
                        onChange={(e) => setCaptionLanguage(e.target.value)}
                        className="bg-gray-900/90 text-white text-xs px-3 py-1.5 rounded-lg border border-green-500/50 focus:outline-none focus:border-green-500"
                      >
                        <option value="en-IN">🇬🇧 English</option>
                        <option value="hi-IN">🇮🇳 हिन्दी</option>
                      </select>
                    </div>
                  )}
                </div>
              ) : null}
              
              {/* Small videos grid */}
              <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2" style={{height: '180px'}}>
                {/* Local Video */}
                <VideoCard isLocal={true} stream={stream} userName="You" />
                
                {/* Other students */}
                {peers.filter(p => p.userType !== 'teacher').map((peer, index) => (
                  <VideoCard key={index} peer={peer.peer} userName={peer.userName} />
                ))}
              </div>
            </div>
          ) : (
            // Teacher view: Equal grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full content-start">
              {/* Local Video */}
              <VideoCard isLocal={true} stream={stream} userName="You" />
              
              {/* Remote Videos */}
              {peers.map((peer, index) => (
                <VideoCard key={index} peer={peer.peer} userName={peer.userName} />
              ))}
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-16 bg-gray-900/90 backdrop-blur-md border border-cyan-900/50 rounded-full flex items-center justify-center gap-2 px-6 z-20 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <button 
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-all duration-300 ${isAudioEnabled ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-500/20 border border-red-500 text-red-500'}`}
            title={isAudioEnabled ? "Mute" : "Unmute"}
          >
            {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-all duration-300 ${isVideoEnabled ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-500/20 border border-red-500 text-red-500'}`}
            title={isVideoEnabled ? "Stop Video" : "Start Video"}
          >
            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
          
          <button 
            onClick={toggleScreenShare}
            className={`p-3 rounded-full transition-all duration-300 ${isScreenSharing ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
            title="Share Screen"
          >
            <Monitor size={20} />
          </button>

          <button 
            onClick={() => setCaptionsEnabled(!captionsEnabled)}
            className={`p-3 rounded-full transition-all duration-300 ${captionsEnabled ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
            title="Toggle Captions"
          >
            <Subtitles size={20} />
          </button>
          
          <div className="w-px h-8 bg-gray-700 mx-2" />
          
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full transition-all duration-300 ${showChat ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
            title="Chat"
          >
            <MessageSquare size={20} />
            {newMessage && !showChat && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-bounce" />}
          </button>
          
          <button 
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-3 rounded-full transition-all duration-300 ${showParticipants ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
            title="Participants"
          >
            <Users size={20} />
          </button>

          <button 
            onClick={() => setShowWhiteboard(!showWhiteboard)}
            className={`p-3 rounded-full transition-all duration-300 ${showWhiteboard ? 'bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
            title="Whiteboard"
          >
            <Presentation size={20} />
          </button>

          {user.role === 'student' && (
            <button 
              onClick={toggleRaiseHand}
              className={`p-3 rounded-full transition-all duration-300 ${isHandRaised ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] animate-bounce' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
              title={isHandRaised ? "Lower Hand" : "Raise Hand"}
            >
              <Hand size={20} />
            </button>
          )}

          {user.role === 'teacher' && raisedHands.length > 0 && (
            <button 
              onClick={lowerAllHands}
              className="p-3 rounded-full bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all duration-300 relative"
              title="Lower All Hands"
            >
              <Hand size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {raisedHands.length}
              </span>
            </button>
          )}

          <div className="w-px h-8 bg-gray-700 mx-2" />
          
          <button 
            onClick={leaveClass}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
            title="Leave Class"
          >
            <Phone size={20} className="rotate-[135deg]" />
          </button>
        </div>
      </div>

      {/* Sidebar (Chat/Participants) */}
      {(showChat || showParticipants) && (
        <div className="w-80 bg-gray-900 border-l border-cyan-900/30 flex flex-col transition-all duration-300 z-30">
          <div className="p-4 border-b border-cyan-900/30 flex justify-between items-center bg-gray-800/50">
            <h2 className="font-bold text-cyan-400 tracking-wider text-sm">
              {showChat ? 'SECURE_CHAT' : 'PARTICIPANTS'}
            </h2>
            <button 
              onClick={() => { setShowChat(false); setShowParticipants(false); }}
              className="text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {showChat && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => {
                  console.log('Message:', msg.userId, 'Current User:', user._id, 'Match:', msg.userId?.toString() === user._id?.toString());
                  const isMyMessage = msg.userId?.toString() === user._id?.toString();
                  return (
                  <div key={idx} className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-[10px] font-bold ${isMyMessage ? 'text-cyan-400' : 'text-purple-400'}`}>
                        {isMyMessage ? 'YOU' : msg.userName?.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`px-3 py-2 rounded-lg max-w-[90%] text-sm ${
                      isMyMessage 
                        ? 'bg-cyan-900/30 border border-cyan-500/30 text-cyan-100 rounded-tr-none' 
                        : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-none'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="p-4 border-t border-cyan-900/30 bg-gray-800/30">
                <div className="relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter message..."
                    className="w-full bg-gray-900 border border-cyan-900/50 rounded-lg pl-4 pr-10 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-cyan-400"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </>
          )}

          {showParticipants && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded bg-cyan-900/20 border border-cyan-500/30">
                  <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xs">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{user.fullName} (You)</p>
                    <p className="text-[10px] text-cyan-500">{user.role.toUpperCase()}</p>
                  </div>
                  <Mic size={14} className="text-green-500" />
                </div>
                
                {peers.map((peer, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-colors">
                    <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs relative">
                      {peer.userName?.charAt(0) || '?'}
                      {raisedHands.some(h => h.userId === peer.userId) && (
                        <span className="absolute -top-1 -right-1 text-orange-500 animate-bounce">
                          ✋
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        {peer.userName || 'Unknown User'}
                        {raisedHands.some(h => h.userId === peer.userId) && (
                          <span className="text-orange-500 text-xs animate-pulse">✋</span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-500">{peer.userType?.toUpperCase() || 'PARTICIPANT'}</p>
                    </div>
                    {user.role === 'teacher' && peer.userType === 'student' && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => muteStudent(peer.peerID)}
                          className="p-1 text-orange-500 hover:bg-orange-500/20 rounded"
                          title="Mute Student"
                        >
                          <VolumeX size={14} />
                        </button>
                        <button 
                          onClick={() => turnOffStudentVideo(peer.peerID)}
                          className="p-1 text-blue-500 hover:bg-blue-500/20 rounded"
                          title="Turn Off Camera"
                        >
                          <VideoOff size={14} />
                        </button>
                        <button 
                          onClick={() => markAttendance(peer.userId, true)}
                          className="p-1 text-green-500 hover:bg-green-500/20 rounded"
                          title="Mark Present"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button 
                          onClick={() => markAttendance(peer.userId, false)}
                          className="p-1 text-red-500 hover:bg-red-500/20 rounded"
                          title="Mark Absent"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Whiteboard Modal */}
      {showWhiteboard && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="w-full h-full max-w-7xl max-h-[90vh] bg-gray-900 rounded-lg overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            <div className="flex justify-between items-center p-3 bg-gray-800 border-b border-cyan-900/30">
              <h2 className="text-cyan-400 font-bold tracking-wider">VIRTUAL WHITEBOARD</h2>
              <button
                onClick={() => setShowWhiteboard(false)}
                className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <Whiteboard socket={socketRef.current} classId={classId} isTeacher={user.role === 'teacher'} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualClass;