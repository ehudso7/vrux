import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import logger from './logger';
import { generateUniqueId } from './utils';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
  selection?: {
    start: number;
    end: number;
  };
}

export interface CollaborationSession {
  id: string;
  componentId: string;
  users: Map<string, CollaborationUser>;
  owner: string;
  createdAt: Date;
  settings: {
    maxUsers: number;
    allowGuests: boolean;
    readOnly: boolean;
  };
}

export interface CollaborationEvent {
  type: 'join' | 'leave' | 'cursor' | 'selection' | 'edit' | 'chat' | 'sync' | 'awareness';
  userId: string;
  sessionId: string;
  data: any;
  timestamp: Date;
}

export interface CodeEdit {
  operation: 'insert' | 'delete' | 'replace';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  version: number;
}

// Operational Transform for conflict resolution
class OperationalTransform {
  static transformOperation(op1: CodeEdit, op2: CodeEdit): CodeEdit {
    // Transform op1 against op2
    if (op1.operation === 'insert' && op2.operation === 'insert') {
      if (op1.position < op2.position) {
        return op1;
      } else if (op1.position > op2.position) {
        return { ...op1, position: op1.position + (op2.content?.length || 0) };
      } else {
        // Same position - use userId for deterministic ordering
        return op1.userId < op2.userId ? op1 : { ...op1, position: op1.position + (op2.content?.length || 0) };
      }
    } else if (op1.operation === 'delete' && op2.operation === 'insert') {
      if (op1.position < op2.position) {
        return op1;
      } else {
        return { ...op1, position: op1.position + (op2.content?.length || 0) };
      }
    } else if (op1.operation === 'insert' && op2.operation === 'delete') {
      if (op1.position <= op2.position) {
        return op1;
      } else if (op1.position > op2.position + (op2.length || 0)) {
        return { ...op1, position: op1.position - (op2.length || 0) };
      } else {
        return { ...op1, position: op2.position };
      }
    } else if (op1.operation === 'delete' && op2.operation === 'delete') {
      if (op1.position < op2.position) {
        return op1;
      } else if (op1.position > op2.position) {
        return { ...op1, position: op1.position - Math.min(op2.length || 0, op1.position - op2.position) };
      } else {
        // Overlapping deletes
        return { ...op1, length: 0 }; // No-op
      }
    }
    
    return op1;
  }
}

export class CollaborationEngine extends EventEmitter {
  private sessions: Map<string, CollaborationSession> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private documentVersions: Map<string, number> = new Map();
  private pendingOperations: Map<string, CodeEdit[]> = new Map();

  constructor() {
    super();
  }

  /**
   * Create a new collaboration session
   */
  createSession(
    componentId: string,
    owner: CollaborationUser,
    settings?: Partial<CollaborationSession['settings']>
  ): CollaborationSession {
    const sessionId = generateUniqueId();
    
    const session: CollaborationSession = {
      id: sessionId,
      componentId,
      users: new Map([[owner.id, owner]]),
      owner: owner.id,
      createdAt: new Date(),
      settings: {
        maxUsers: 10,
        allowGuests: true,
        readOnly: false,
        ...settings
      }
    };

    this.sessions.set(sessionId, session);
    this.documentVersions.set(sessionId, 0);
    this.pendingOperations.set(sessionId, []);
    
    // Track user sessions
    if (!this.userSessions.has(owner.id)) {
      this.userSessions.set(owner.id, new Set());
    }
    this.userSessions.get(owner.id)!.add(sessionId);

    logger.info('Collaboration session created', { sessionId, componentId, owner: owner.id });
    
    return session;
  }

  /**
   * Join an existing session
   */
  async joinSession(sessionId: string, user: CollaborationUser): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Check max users
    if (session.users.size >= session.settings.maxUsers) {
      throw new Error('Session is full');
    }

    // Check if guests are allowed
    if (!session.settings.allowGuests && !this.isAuthorizedUser(user.id, session)) {
      throw new Error('Guests not allowed in this session');
    }

    // Assign a unique color to the user
    user.color = this.generateUserColor(session.users.size);
    
    // Add user to session
    session.users.set(user.id, user);
    
    // Track user sessions
    if (!this.userSessions.has(user.id)) {
      this.userSessions.set(user.id, new Set());
    }
    this.userSessions.get(user.id)!.add(sessionId);

    // Broadcast join event
    this.broadcastToSession(sessionId, {
      type: 'join',
      userId: user.id,
      sessionId,
      data: { user },
      timestamp: new Date()
    }, user.id);

    // Send current state to new user
    this.emit('sync-request', {
      sessionId,
      userId: user.id,
      version: this.documentVersions.get(sessionId) || 0
    });

    logger.info('User joined collaboration session', { sessionId, userId: user.id });
    
    return true;
  }

  /**
   * Leave a session
   */
  leaveSession(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const user = session.users.get(userId);
    if (!user) return;

    // Remove user from session
    session.users.delete(userId);
    
    // Remove from user sessions
    const userSessions = this.userSessions.get(userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.userSessions.delete(userId);
      }
    }

    // Broadcast leave event
    this.broadcastToSession(sessionId, {
      type: 'leave',
      userId,
      sessionId,
      data: { userId },
      timestamp: new Date()
    });

    // Clean up empty sessions
    if (session.users.size === 0) {
      this.sessions.delete(sessionId);
      this.documentVersions.delete(sessionId);
      this.pendingOperations.delete(sessionId);
      logger.info('Collaboration session ended (no users)', { sessionId });
    }
  }

  /**
   * Handle cursor movement
   */
  updateCursor(sessionId: string, userId: string, cursor: { x: number; y: number }): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const user = session.users.get(userId);
    if (!user) return;

    user.cursor = cursor;

    // Broadcast cursor update
    this.broadcastToSession(sessionId, {
      type: 'cursor',
      userId,
      sessionId,
      data: { cursor },
      timestamp: new Date()
    }, userId);
  }

  /**
   * Handle selection change
   */
  updateSelection(sessionId: string, userId: string, selection: { start: number; end: number }): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const user = session.users.get(userId);
    if (!user) return;

    user.selection = selection;

    // Broadcast selection update
    this.broadcastToSession(sessionId, {
      type: 'selection',
      userId,
      sessionId,
      data: { selection },
      timestamp: new Date()
    }, userId);
  }

  /**
   * Handle code edit with operational transform
   */
  async applyEdit(sessionId: string, edit: CodeEdit): Promise<CodeEdit> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    if (session.settings.readOnly && session.owner !== edit.userId) {
      throw new Error('Session is read-only');
    }

    const currentVersion = this.documentVersions.get(sessionId) || 0;
    
    // Transform against pending operations
    let transformedEdit = edit;
    const pendingOps = this.pendingOperations.get(sessionId) || [];
    
    for (const pendingOp of pendingOps) {
      if (pendingOp.version >= edit.version) {
        transformedEdit = OperationalTransform.transformOperation(transformedEdit, pendingOp);
      }
    }

    // Update version
    transformedEdit.version = currentVersion + 1;
    this.documentVersions.set(sessionId, transformedEdit.version);

    // Add to pending operations
    pendingOps.push(transformedEdit);
    if (pendingOps.length > 100) {
      // Keep only recent operations
      this.pendingOperations.set(sessionId, pendingOps.slice(-50));
    } else {
      this.pendingOperations.set(sessionId, pendingOps);
    }

    // Broadcast edit
    this.broadcastToSession(sessionId, {
      type: 'edit',
      userId: edit.userId,
      sessionId,
      data: transformedEdit,
      timestamp: new Date()
    }, edit.userId);

    return transformedEdit;
  }

  /**
   * Send chat message
   */
  sendChatMessage(sessionId: string, userId: string, message: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const user = session.users.get(userId);
    if (!user) return;

    const chatMessage = {
      id: generateUniqueId(),
      userId,
      userName: user.name,
      userAvatar: user.avatar,
      message,
      timestamp: new Date()
    };

    // Broadcast chat message
    this.broadcastToSession(sessionId, {
      type: 'chat',
      userId,
      sessionId,
      data: chatMessage,
      timestamp: new Date()
    });
  }

  /**
   * Get session info
   */
  getSession(sessionId: string): CollaborationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get active users in session
   */
  getActiveUsers(sessionId: string): CollaborationUser[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    return Array.from(session.users.values());
  }

  /**
   * Broadcast event to all users in session
   */
  private broadcastToSession(sessionId: string, event: CollaborationEvent, excludeUserId?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.users.forEach((user, userId) => {
      if (userId !== excludeUserId) {
        this.emit('collaboration-event', {
          ...event,
          targetUserId: userId
        });
      }
    });
  }

  /**
   * Check if user is authorized for session
   */
  private isAuthorizedUser(userId: string, session: CollaborationSession): boolean {
    // In a real app, check against authorized user list
    return true;
  }

  /**
   * Generate unique color for user
   */
  private generateUserColor(index: number): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#F9CA24', '#6C5CE7',
      '#A8E6CF', '#FFD93D', '#FCB1A6', '#B2DFDB', '#D4A5A5'
    ];
    return colors[index % colors.length];
  }

  /**
   * Get user's active sessions
   */
  getUserSessions(userId: string): CollaborationSession[] {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return [];

    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter(Boolean) as CollaborationSession[];
  }

  /**
   * Handle WebSocket connection for real-time collaboration
   */
  handleWebSocket(ws: WebSocket, userId: string): void {
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join':
            await this.joinSession(message.sessionId, message.user);
            break;
            
          case 'leave':
            this.leaveSession(message.sessionId, userId);
            break;
            
          case 'cursor':
            this.updateCursor(message.sessionId, userId, message.cursor);
            break;
            
          case 'selection':
            this.updateSelection(message.sessionId, userId, message.selection);
            break;
            
          case 'edit':
            await this.applyEdit(message.sessionId, message.edit);
            break;
            
          case 'chat':
            this.sendChatMessage(message.sessionId, userId, message.message);
            break;
        }
      } catch (error) {
        logger.error('WebSocket message error', error as Error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      }
    });

    ws.on('close', () => {
      // Clean up user sessions
      const sessions = this.getUserSessions(userId);
      sessions.forEach(session => {
        this.leaveSession(session.id, userId);
      });
    });

    // Listen for events to send to this user
    const eventHandler = (event: CollaborationEvent & { targetUserId?: string }) => {
      if (event.targetUserId === userId) {
        ws.send(JSON.stringify(event));
      }
    };

    this.on('collaboration-event', eventHandler);
    
    ws.on('close', () => {
      this.off('collaboration-event', eventHandler);
    });
  }
}

// Export singleton instance
export const collaborationEngine = new CollaborationEngine();