import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface SharedComponent {
  id: string;
  code: string;
  title: string;
  description?: string;
  tags?: string[];
  isPublic: boolean;
  userId: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  likes: number;
}

class ShareStore {
  private shares: Map<string, SharedComponent> = new Map();
  private userLikes: Map<string, Set<string>> = new Map(); // userId -> Set of share IDs
  private filePath = path.join(process.cwd(), 'data', 'shares.json');

  constructor() {
    this.loadFromFile();
  }

  private async loadFromFile() {
    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Restore shares
      parsed.shares.forEach((share: SharedComponent & { createdAt: string; updatedAt: string }) => {
        this.shares.set(share.id, {
          ...share,
          createdAt: new Date(share.createdAt),
          updatedAt: new Date(share.updatedAt),
        });
      });
      
      // Restore likes
      Object.entries(parsed.userLikes || {}).forEach(([userId, likes]) => {
        this.userLikes.set(userId, new Set(likes as string[]));
      });
    } catch {
      // File doesn't exist or is invalid, start with empty store
    }
  }

  private async saveToFile() {
    try {
      const data = {
        shares: Array.from(this.shares.values()),
        userLikes: Object.fromEntries(
          Array.from(this.userLikes.entries()).map(([userId, likes]) => [
            userId,
            Array.from(likes),
          ])
        ),
      };
      
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch {
      // Silently fail to save shares
    }
  }

  async createShare(
    userId: string,
    userName: string,
    data: {
      code: string;
      title: string;
      description?: string;
      tags?: string[];
      isPublic?: boolean;
    }
  ): Promise<SharedComponent> {
    const id = crypto.randomBytes(6).toString('hex');
    
    const share: SharedComponent = {
      id,
      code: data.code,
      title: data.title,
      description: data.description,
      tags: data.tags || [],
      isPublic: data.isPublic ?? true,
      userId,
      userName,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      likes: 0,
    };
    
    this.shares.set(id, share);
    await this.saveToFile();
    
    return share;
  }

  async getShare(id: string, viewerId?: string): Promise<SharedComponent | null> {
    const share = this.shares.get(id);
    
    if (!share) {
      return null;
    }
    
    // Check access permissions
    if (!share.isPublic && share.userId !== viewerId) {
      return null;
    }
    
    // Increment view count
    share.views++;
    share.updatedAt = new Date();
    await this.saveToFile();
    
    return share;
  }

  async updateShare(
    id: string,
    userId: string,
    updates: Partial<{
      title: string;
      description: string;
      tags: string[];
      isPublic: boolean;
      code: string;
    }>
  ): Promise<SharedComponent | null> {
    const share = this.shares.get(id);
    
    if (!share || share.userId !== userId) {
      return null;
    }
    
    Object.assign(share, updates, { updatedAt: new Date() });
    await this.saveToFile();
    
    return share;
  }

  async deleteShare(id: string, userId: string): Promise<boolean> {
    const share = this.shares.get(id);
    
    if (!share || share.userId !== userId) {
      return false;
    }
    
    this.shares.delete(id);
    
    // Remove all likes for this share
    this.userLikes.forEach((likes) => {
      likes.delete(id);
    });
    
    await this.saveToFile();
    return true;
  }

  async toggleLike(shareId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    const share = this.shares.get(shareId);
    
    if (!share || (!share.isPublic && share.userId !== userId)) {
      throw new Error('Share not found or access denied');
    }
    
    let userLikes = this.userLikes.get(userId);
    if (!userLikes) {
      userLikes = new Set();
      this.userLikes.set(userId, userLikes);
    }
    
    let liked: boolean;
    if (userLikes.has(shareId)) {
      userLikes.delete(shareId);
      share.likes--;
      liked = false;
    } else {
      userLikes.add(shareId);
      share.likes++;
      liked = true;
    }
    
    share.updatedAt = new Date();
    await this.saveToFile();
    
    return { liked, likes: share.likes };
  }

  async listPublicShares(options: {
    limit?: number;
    offset?: number;
    tag?: string;
    userId?: string;
    sortBy?: 'recent' | 'popular' | 'views';
  } = {}): Promise<{ shares: SharedComponent[]; total: number }> {
    const { limit = 20, offset = 0, tag, userId, sortBy = 'recent' } = options;
    
    let shares = Array.from(this.shares.values()).filter(share => {
      if (!share.isPublic && share.userId !== userId) return false;
      if (tag && !share.tags?.includes(tag)) return false;
      if (userId && share.userId !== userId) return false;
      return true;
    });
    
    // Sort
    switch (sortBy) {
      case 'popular':
        shares.sort((a, b) => b.likes - a.likes);
        break;
      case 'views':
        shares.sort((a, b) => b.views - a.views);
        break;
      case 'recent':
      default:
        shares.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    
    const total = shares.length;
    shares = shares.slice(offset, offset + limit);
    
    return { shares, total };
  }

  async getUserShares(userId: string): Promise<SharedComponent[]> {
    return Array.from(this.shares.values())
      .filter(share => share.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserLikedShares(userId: string): Promise<SharedComponent[]> {
    const likes = this.userLikes.get(userId);
    if (!likes) return [];
    
    return Array.from(likes)
      .map(id => this.shares.get(id))
      .filter((share): share is SharedComponent => !!share && share.isPublic)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPopularTags(limit: number = 10): Promise<{ tag: string; count: number }[]> {
    const tagCounts = new Map<string, number>();
    
    this.shares.forEach(share => {
      if (share.isPublic && share.tags) {
        share.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });
    
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

// Singleton instance
export const shareStore = new ShareStore();