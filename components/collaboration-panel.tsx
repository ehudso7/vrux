import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Share2,
  UserPlus,
  Lock,
  Unlock,
  Eye,
  Edit3,
  X,
  Send,
  Circle,
  CheckCircle,
  Video,
  Mic,
  MicOff,
  Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useAuth } from '../lib/auth-context';
import toast from 'react-hot-toast';

interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
  role: 'owner' | 'editor' | 'viewer';
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Date;
}

interface CollaborationPanelProps {
  sessionId: string;
  componentId: string;
  onClose?: () => void;
  onInvite?: (email: string) => void;
  className?: string;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  sessionId,
  componentId,
  onClose,
  onInvite,
  className = ''
}) => {
  const { user: currentUser } = useAuth();
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [sessionSettings, setSessionSettings] = useState({
    readOnly: false,
    allowGuests: true,
    maxUsers: 10
  });
  const [activeTab, setActiveTab] = useState<'users' | 'chat'>('users');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!sessionId || !currentUser) return;

    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/collaboration/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Join session
      ws.send(JSON.stringify({
        type: 'join',
        sessionId,
        user: {
          id: currentUser.id,
          name: currentUser.name || currentUser.email,
          email: currentUser.email,
          avatar: (currentUser as any).avatarUrl || ''
        }
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleCollaborationEvent(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error. Please refresh the page.');
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave', sessionId }));
        ws.close();
      }
    };
  }, [sessionId, currentUser]);

  // Handle collaboration events
  const handleCollaborationEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'join':
        setActiveUsers(prev => [...prev, event.data.user]);
        toast.success(`${event.data.user.name} joined the session`);
        break;

      case 'leave':
        setActiveUsers(prev => prev.filter(u => u.id !== event.data.userId));
        break;

      case 'cursor':
        setActiveUsers(prev => prev.map(u => 
          u.id === event.userId ? { ...u, cursor: event.data.cursor } : u
        ));
        break;

      case 'selection':
        setActiveUsers(prev => prev.map(u => 
          u.id === event.userId ? { ...u, selection: event.data.selection } : u
        ));
        break;

      case 'chat':
        setChatMessages(prev => [...prev, event.data]);
        break;

      case 'typing':
        if (event.data.isTyping) {
          setIsTyping(prev => [...prev.filter(id => id !== event.userId), event.userId]);
        } else {
          setIsTyping(prev => prev.filter(id => id !== event.userId));
        }
        break;

      case 'sync':
        // Sync current state
        setActiveUsers(event.data.users || []);
        setChatMessages(event.data.messages || []);
        setSessionSettings(event.data.settings || sessionSettings);
        break;
    }
  }, [sessionSettings]);

  // Send chat message
  const sendMessage = useCallback(() => {
    if (!chatInput.trim() || !wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'chat',
      sessionId,
      message: chatInput
    }));

    setChatInput('');
  }, [chatInput, sessionId]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!wsRef.current) return;

    // Send typing start
    wsRef.current.send(JSON.stringify({
      type: 'typing',
      sessionId,
      data: { isTyping: true }
    }));

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'typing',
          sessionId,
          data: { isTyping: false }
        }));
      }
    }, 1000);
  }, [sessionId]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Send invite
  const handleInvite = useCallback(() => {
    if (!inviteEmail || !onInvite) return;

    onInvite(inviteEmail);
    setInviteEmail('');
    setShowInvite(false);
    toast.success('Invitation sent!');
  }, [inviteEmail, onInvite]);

  // Copy session link
  const copySessionLink = useCallback(() => {
    const link = `${window.location.origin}/collaborate/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast.success('Session link copied!');
  }, [sessionId]);

  // Get typing users display
  const typingUsers = activeUsers.filter(u => isTyping.includes(u.id));
  const typingDisplay = typingUsers.length > 0 ? 
    `${typingUsers.map(u => u.name).join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing...` : 
    null;

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="font-semibold">Collaboration</span>
            </div>
            <div className="flex -space-x-2">
              {activeUsers.slice(0, 3).map(user => (
                <div
                  key={user.id}
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-medium text-white"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {activeUsers.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-medium">
                  +{activeUsers.length - 3}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInvite(!showInvite)}
            >
              <UserPlus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={copySessionLink}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Invite Form */}
        <AnimatePresence>
          {showInvite && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  placeholder="Enter email to invite"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
                <Button size="sm" onClick={handleInvite}>
                  Send Invite
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Active Users ({activeUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            Chat
            {chatMessages.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
                {chatMessages.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'users' ? (
          <div className="p-4 space-y-3 overflow-y-auto h-full">
            {activeUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name}</span>
                      {user.id === currentUser?.id && (
                        <span className="text-xs text-gray-500">(You)</span>
                      )}
                      {user.role === 'owner' && (
                        <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded">
                          Owner
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Circle className={`w-2 h-2 ${user.isOnline ? 'text-green-500' : 'text-gray-400'}`} />
                        {user.isOnline ? 'Active' : 'Away'}
                      </span>
                      {user.cursor && (
                        <span>Cursor: {Math.round(user.cursor.x)}, {Math.round(user.cursor.y)}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {user.role === 'editor' && <Edit3 className="w-4 h-4 text-gray-500" />}
                  {user.role === 'viewer' && <Eye className="w-4 h-4 text-gray-500" />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Chat Messages */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.userId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${msg.userId === currentUser?.id ? 'order-2' : 'order-1'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.userId !== currentUser?.id && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">{msg.userName}</span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-lg ${
                        msg.userId === currentUser?.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Typing Indicator */}
            {typingDisplay && (
              <div className="px-4 py-2 text-xs text-gray-500 italic">
                {typingDisplay}
              </div>
            )}

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
                <Button size="sm" onClick={sendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session Settings (for owner) */}
      {activeUsers.find(u => u.id === currentUser?.id)?.role === 'owner' && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sessionSettings.readOnly}
                onChange={(e) => setSessionSettings(prev => ({ ...prev, readOnly: e.target.checked }))}
                className="rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">Read-only mode</span>
              {sessionSettings.readOnly ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </label>
            
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};