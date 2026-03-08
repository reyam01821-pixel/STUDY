// porte-bos/src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import { 
  Users, MessageSquare, Plus, Search, Shield, LogOut, Send, Phone, Video, User as UserIcon, Hash, Inbox, Settings, Mic, MicOff, Camera, CameraOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Group, Message, PrivateMessage } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedPrivateUser, setSelectedPrivateUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState<(User & { is_group_admin: number })[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPurpose, setNewGroupPurpose] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchGroupId, setSearchGroupId] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callParticipants, setCallParticipants] = useState<string[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [privateChats, setPrivateChats] = useState<User[]>([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'groups' | 'inbox'>('groups');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<{ [userId: string]: Peer.Instance }>({});
  const [remoteStreams, setRemoteStreams] = useState<{ [userId: string]: MediaStream }>({});

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ------------------------
  // Effects
  // ------------------------
  useEffect(() => {
    if (user) {
      socketRef.current = io();
      socketRef.current.emit('identify', user.id);
      fetchGroups(user.id);
      fetchAllUsers();

      const hash = window.location.hash;
      if (hash.startsWith('#group=')) {
        const groupId = hash.replace('#group=', '');
        handleJoinGroup(groupId);
        window.location.hash = '';
      }

      socketRef.current.on('new-message', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      socketRef.current.on('new-private-message', (message: PrivateMessage) => {
        setPrivateMessages(prev => [...prev, message]);
        const otherUserId = message.senderId === user.id ? message.receiverId : message.senderId;
        if (otherUserId) {
          fetchUserById(otherUserId).then(otherUser => {
            if (otherUser) {
              setPrivateChats(prev => prev.some(u => u.id === otherUser.id) ? prev : [...prev, otherUser]);
            }
          });
        }
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, privateMessages]);

  // ------------------------
  // Fetch Functions
  // ------------------------
  const fetchGroups = async (userId: string) => {
    const res = await fetch(`/api/groups/${userId}`);
    const data = await res.json();
    setGroups(data);
  };

  const fetchGroupMembers = async (groupId: string) => {
    const res = await fetch(`/api/groups/${groupId}/members`);
    const data = await res.json();
    setGroupMembers(data);
  };

  const fetchMessages = async (groupId: string) => {
    const res = await fetch(`/api/messages/${groupId}`);
    const data = await res.json();
    setMessages(data);
  };

  const fetchPrivateMessages = async (user1: string, user2: string) => {
    const res = await fetch(`/api/private-messages/${user1}/${user2}`);
    const data = await res.json();
    setPrivateMessages(data);
  };

  const fetchAllUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setAllUsers(data);
  };

  const fetchUserById = async (id: string): Promise<User | null> => {
    try {
      const res = await fetch(`/api/user/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  // ------------------------
  // Handlers
  // ------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Login failed');
      return;
    }
    setUser(data);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    if (selectedGroup) {
      socketRef.current?.emit('send-message', {
        groupId: selectedGroup.id,
        userId: user.id,
        content: newMessage
      });
    } else if (selectedPrivateUser) {
      socketRef.current?.emit('send-private-message', {
        senderId: user.id,
        receiverId: selectedPrivateUser.id,
        content: newMessage
      });
    }
    setNewMessage('');
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    const res = await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, userId: user.id })
    });
    if (res.ok) {
      const group = await res.json();
      setGroups(prev => prev.some(g => g.id === group.id) ? prev : [...prev, group]);
      setSelectedGroup(group);
    }
  };

  // ------------------------
  // UI
  // ------------------------
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">{isLoginMode ? 'Sign In' : 'Create Account'}</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full px-4 py-3 rounded-xl border border-slate-200"/>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 rounded-xl border border-slate-200"/>
            <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl">{isLoginMode ? 'Sign In' : 'Sign Up'}</button>
          </form>
          <button onClick={() => setIsLoginMode(!isLoginMode)} className="mt-4 text-sm text-brand-600 hover:underline">
            {isLoginMode ? 'Create an account' : 'Back to Sign In'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col p-4 space-y-4">
        <h2 className="font-bold text-slate-800">{user.username}</h2>
        <button onClick={() => setUser(null)}>Logout</button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white p-4">
        {(selectedGroup || selectedPrivateUser) ? (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">{selectedGroup ? selectedGroup.name : selectedPrivateUser?.username}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
              {(selectedGroup ? messages : privateMessages).map((msg, idx) => {
                const msgUserId = selectedGroup ? (msg.userId || msg.user_id) : (msg.senderId || msg.sender_id);
                const isMe = msgUserId === user.id;
                return (
                  <div key={idx} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200'}`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex gap-2">
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-2 rounded-xl bg-slate-100 border-none"/>
              <button type="submit" className="bg-brand-600 text-white p-2 rounded-xl">Send</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">Select a chat to start</div>
        )}
      </div>
    </div>
  );
}
