import { ComponentVersion } from '../components/version-history';
import { generateUniqueId } from './utils';
import logger from './logger';

export interface VersionControlOptions {
  maxVersions?: number;
  autoTag?: boolean;
  compressOldVersions?: boolean;
}

export interface VersionDiff {
  added: string[];
  removed: string[];
  modified: string[];
  similarity: number;
}

export class VersionControlService {
  private versions: Map<string, ComponentVersion[]> = new Map();
  private options: VersionControlOptions;

  constructor(options: VersionControlOptions = {}) {
    this.options = {
      maxVersions: 100,
      autoTag: true,
      compressOldVersions: true,
      ...options
    };
  }

  /**
   * Create a new version of a component
   */
  async createVersion(
    componentId: string,
    code: string,
    prompt: string,
    author: { id: string; name: string; avatar?: string },
    metadata?: Partial<ComponentVersion['metadata']>,
    message?: string
  ): Promise<ComponentVersion> {
    const versions = this.getVersions(componentId);
    const latestVersion = versions[0];
    
    // Generate version number
    const versionNumber = this.generateVersionNumber(latestVersion?.version);
    
    // Auto-generate tags based on changes
    const tags = this.options.autoTag ? this.generateTags(code, latestVersion?.code) : [];
    
    // Create new version
    const newVersion: ComponentVersion = {
      id: generateUniqueId(),
      version: versionNumber,
      code,
      prompt,
      parentVersion: latestVersion?.id,
      author,
      timestamp: new Date(),
      message: message || this.generateCommitMessage(code, latestVersion?.code),
      tags,
      metadata: {
        ...metadata,
        tokenCount: this.estimateTokenCount(code)
      },
      stats: {
        views: 0,
        copies: 0,
        stars: 0
      },
      isCurrent: true
    };

    // Mark previous versions as not current
    versions.forEach(v => v.isCurrent = false);
    
    // Add new version
    versions.unshift(newVersion);
    
    // Manage version limit
    if (versions.length > this.options.maxVersions!) {
      const removed = versions.splice(this.options.maxVersions!);
      logger.info(`Removed ${removed.length} old versions for component ${componentId}`);
    }
    
    this.versions.set(componentId, versions);
    
    // Persist to storage (in real app, this would be an API call)
    await this.persistVersions(componentId, versions);
    
    return newVersion;
  }

  /**
   * Get all versions for a component
   */
  getVersions(componentId: string): ComponentVersion[] {
    return this.versions.get(componentId) || [];
  }

  /**
   * Get a specific version
   */
  getVersion(componentId: string, versionId: string): ComponentVersion | null {
    const versions = this.getVersions(componentId);
    return versions.find(v => v.id === versionId) || null;
  }

  /**
   * Restore a previous version
   */
  async restoreVersion(
    componentId: string,
    versionId: string,
    author: { id: string; name: string; avatar?: string }
  ): Promise<ComponentVersion | null> {
    const version = this.getVersion(componentId, versionId);
    if (!version) return null;
    
    // Create a new version based on the restored one
    const restoredVersion = await this.createVersion(
      componentId,
      version.code,
      version.prompt,
      author,
      version.metadata,
      `Restored from v${version.version}`
    );
    
    restoredVersion.tags.push('restored');
    
    return restoredVersion;
  }

  /**
   * Compare two versions
   */
  compareVersions(versionA: ComponentVersion, versionB: ComponentVersion): VersionDiff {
    const linesA = versionA.code.split('\n');
    const linesB = versionB.code.split('\n');
    
    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];
    
    // Simple line-based diff (in production, use a proper diff algorithm)
    const setA = new Set(linesA);
    const setB = new Set(linesB);
    
    linesB.forEach((line, index) => {
      if (!setA.has(line)) {
        added.push(`+${index}: ${line}`);
      }
    });
    
    linesA.forEach((line, index) => {
      if (!setB.has(line)) {
        removed.push(`-${index}: ${line}`);
      }
    });
    
    // Calculate similarity
    const totalLines = Math.max(linesA.length, linesB.length);
    const changedLines = added.length + removed.length;
    const similarity = 1 - (changedLines / totalLines);
    
    return {
      added,
      removed,
      modified,
      similarity: Math.max(0, Math.min(1, similarity))
    };
  }

  /**
   * Delete a version
   */
  async deleteVersion(componentId: string, versionId: string): Promise<boolean> {
    const versions = this.getVersions(componentId);
    const index = versions.findIndex(v => v.id === versionId);
    
    if (index === -1 || versions[index].isCurrent) {
      return false; // Can't delete current version
    }
    
    versions.splice(index, 1);
    this.versions.set(componentId, versions);
    
    await this.persistVersions(componentId, versions);
    return true;
  }

  /**
   * Star/unstar a version
   */
  async toggleStar(componentId: string, versionId: string): Promise<boolean> {
    const version = this.getVersion(componentId, versionId);
    if (!version) return false;
    
    version.isStarred = !version.isStarred;
    version.stats.stars += version.isStarred ? 1 : -1;
    
    const versions = this.getVersions(componentId);
    await this.persistVersions(componentId, versions);
    
    return version.isStarred;
  }

  /**
   * Update version stats
   */
  async updateStats(
    componentId: string,
    versionId: string,
    stat: 'views' | 'copies',
    increment: number = 1
  ): Promise<void> {
    const version = this.getVersion(componentId, versionId);
    if (!version) return;
    
    version.stats[stat] += increment;
    
    const versions = this.getVersions(componentId);
    await this.persistVersions(componentId, versions);
  }

  /**
   * Generate next version number
   */
  private generateVersionNumber(previousVersion?: string): string {
    if (!previousVersion) return '1.0.0';
    
    const parts = previousVersion.split('.').map(p => parseInt(p, 10));
    if (parts.length !== 3) return '1.0.0';
    
    // Increment patch version
    parts[2]++;
    
    // Handle overflow
    if (parts[2] >= 100) {
      parts[2] = 0;
      parts[1]++;
    }
    if (parts[1] >= 100) {
      parts[1] = 0;
      parts[0]++;
    }
    
    return parts.join('.');
  }

  /**
   * Generate tags based on code changes
   */
  private generateTags(newCode: string, oldCode?: string): string[] {
    const tags: string[] = [];
    
    if (!oldCode) {
      tags.push('initial');
      return tags;
    }
    
    // Analyze changes
    const diff = this.compareVersions(
      { code: newCode } as ComponentVersion,
      { code: oldCode } as ComponentVersion
    );
    
    if (diff.similarity > 0.9) {
      tags.push('minor-change');
    } else if (diff.similarity > 0.7) {
      tags.push('moderate-change');
    } else {
      tags.push('major-change');
    }
    
    // Check for specific patterns
    if (newCode.includes('useState') && !oldCode.includes('useState')) {
      tags.push('added-state');
    }
    if (newCode.includes('useEffect') && !oldCode.includes('useEffect')) {
      tags.push('added-effects');
    }
    if (newCode.match(/className=/) && !oldCode.match(/className=/)) {
      tags.push('added-styling');
    }
    if (newCode.length < oldCode.length * 0.8) {
      tags.push('refactored');
    }
    if (newCode.includes('async') && !oldCode.includes('async')) {
      tags.push('added-async');
    }
    
    return tags;
  }

  /**
   * Generate commit message based on changes
   */
  private generateCommitMessage(newCode: string, oldCode?: string): string {
    if (!oldCode) return 'Initial component version';
    
    const tags = this.generateTags(newCode, oldCode);
    
    if (tags.includes('minor-change')) {
      return 'Minor updates and improvements';
    }
    if (tags.includes('major-change')) {
      return 'Major component restructuring';
    }
    if (tags.includes('added-state')) {
      return 'Added state management';
    }
    if (tags.includes('added-styling')) {
      return 'Updated component styling';
    }
    if (tags.includes('refactored')) {
      return 'Refactored component code';
    }
    
    return 'Updated component';
  }

  /**
   * Estimate token count for code
   */
  private estimateTokenCount(code: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(code.length / 4);
  }

  /**
   * Persist versions to storage
   */
  private async persistVersions(componentId: string, versions: ComponentVersion[]): Promise<void> {
    // In a real app, this would save to a database or API
    if (typeof window !== 'undefined') {
      const key = `vrux_versions_${componentId}`;
      localStorage.setItem(key, JSON.stringify(versions));
    }
  }

  /**
   * Load versions from storage
   */
  async loadVersions(componentId: string): Promise<void> {
    if (typeof window !== 'undefined') {
      const key = `vrux_versions_${componentId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const versions = JSON.parse(stored);
          // Convert date strings back to Date objects
          versions.forEach((v: any) => {
            v.timestamp = new Date(v.timestamp);
          });
          this.versions.set(componentId, versions);
        } catch (err) {
          logger.error('Failed to load versions', err as Error);
        }
      }
    }
  }

  /**
   * Export versions for a component
   */
  exportVersions(componentId: string): string {
    const versions = this.getVersions(componentId);
    return JSON.stringify(versions, null, 2);
  }

  /**
   * Import versions for a component
   */
  importVersions(componentId: string, data: string): boolean {
    try {
      const versions = JSON.parse(data);
      // Validate and convert dates
      versions.forEach((v: any) => {
        v.timestamp = new Date(v.timestamp);
      });
      this.versions.set(componentId, versions);
      return true;
    } catch (err) {
      logger.error('Failed to import versions', err as Error);
      return false;
    }
  }
}

// Export singleton instance
export const versionControl = new VersionControlService();