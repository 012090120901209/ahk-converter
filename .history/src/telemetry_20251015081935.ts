
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface TelemetryEvent {
  type: 'conversion' | 'error' | 'performance' | 'usage' | 'profile';
  timestamp: number;
  sessionId: string;
  data: any;
}

export interface ConversionTelemetryData {
  fileSize: number;
  lineCount: number;
  processingTime: number;
  profileUsed: string;
  success: boolean;
  warnings: number;
  errors: number;
  conversionMode: 'new' | 'replace' | 'diff' | 'batch';
  memoryUsage?: number;
  chunksProcessed?: number;
}

export interface ErrorTelemetryData {
  errorType: string;
  errorCode: string;
  errorMessage: string;
  context: string;
  stackTrace?: string;
  recoveryAction?: string;
}

export interface PerformanceTelemetryData {
  operation: string;
  duration: number;
  memoryUsage: number;
  linesProcessed: number;
  chunksProcessed: number;
  peakMemoryUsage: number;
  averageChunkTime: number;
}

export interface UsageTelemetryData {
  action: string;
  feature: string;
  duration?: number;
  parameters?: any;
}

export interface ProfileTelemetryData {
  action: 'create' | 'edit' | 'delete' | 'import' | 'export' | 'apply';
  profileType: 'predefined' | 'custom';
  profileName: string;
  rulesCount: number;
}

export class TelemetryManager {
  private static instance: TelemetryManager;
  private sessionId: string;
  private telemetryPath: string;
  private events: TelemetryEvent[] = [];
  private isEnabled: boolean = true;
  private flushInterval?: NodeJS.Timeout;
  private readonly MAX_EVENTS_IN_MEMORY = 100;
  private readonly FLUSH_INTERVAL = 60000; // 1 minute

  private constructor(context: vscode.ExtensionContext) {
    this.sessionId = this.generateSessionId();
    this.telemetryPath = path.join(context.globalStorageUri.fsPath, 'telemetry.json');
    this.loadConfiguration();
    this.startFlushTimer();
  }

  static getInstance(context?: vscode.ExtensionContext): TelemetryManager {
    if (!TelemetryManager.instance) {
      if (!context) {
        throw new Error('Extension context required for first initialization');
      }
      TelemetryManager.instance = new TelemetryManager(context);
    }
    return TelemetryManager.instance;
  }

  private generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration('ahkConverter');
    this.isEnabled = config.get<boolean>('enableTelemetry', true);
  }

  private startFlushTimer(): void {
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, this.FLUSH_INTERVAL);
  }

  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      const eventsToFlush = [...this.events];
      this.events = [];

      await this.writeEventsToFile(eventsToFlush);
      await this.aggregateAndReport(eventsToFlush);
    } catch (error) {
      console.error('Failed to flush telemetry events:', error);
    }
  }

  private async writeEventsToFile(events: TelemetryEvent[]): Promise<void> {
    try {
      const dir = path.dirname(this.telemetryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let existingEvents: TelemetryEvent[] = [];
      if (fs.existsSync(this.telemetryPath)) {
        const data = fs.readFileSync(this.telemetryPath, 'utf8');
        existingEvents = JSON.parse(data);
      }

      // Keep only last 1000 events to prevent file from growing too large
      const allEvents = [...existingEvents, ...events].slice(-1000);
      fs.writeFileSync(this.telemetryPath, JSON.stringify(allEvents, null, 2));
    } catch (error) {
      console.error('Failed to write telemetry events to file:', error);
    }
  }

  private async aggregateAndReport(events: TelemetryEvent[]): Promise<void> {
    // Aggregate events for reporting
    const aggregated = this.aggregateEvents(events);
    
    // Generate daily/weekly reports
    await this.generateReports(aggregated);
  }

  private aggregateEvents(events: TelemetryEvent[]): any {
    const aggregated: any = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      events: {
        conversion: events.filter(e => e.type === 'conversion').length,
        error: events.filter(e => e.type === 'error').length,
        performance: events.filter(e => e.type === 'performance').length,
        usage: events.filter(e => e.type === 'usage').length,
        profile: events.filter(e => e.type === 'profile').length
      },
      conversionStats: this.aggregateConversionEvents(events.filter(e => e.type === 'conversion')),
      errorStats: this.aggregateErrorEvents(events.filter(e => e.type === 'error')),
      performanceStats: this.aggregatePerformanceEvents(events.filter(e => e.type === 'performance'))
    };

    return aggregated;
  }

  private aggregateConversionEvents(events: TelemetryEvent[]): any {
    const successful = events.filter(e => e.data.success).length;
    const total = events.length;
    const avgProcessingTime = events.reduce((sum, e) => sum + e.data.processingTime, 0) / total;
    const avgFileSize = events.reduce((sum, e) => sum + e.data.fileSize, 0) / total;
    const avgLineCount = events.reduce((sum, e) => sum + e.data.lineCount, 0) / total;

    return {
      total,
      successful,
      successRate: (successful / total) * 100,
      avgProcessingTime,
      avgFileSize,
      profilesUsed: this.countProfilesUsed(events)
    };
  }

  private aggregateErrorEvents(events: TelemetryEvent[]): any {
    const errorTypes = events.reduce((acc, e) => {
      acc[e.data.errorType] = (acc[e.data.errorType] || 0) + 1;
      return acc;
    }, {});

    return {
      total: events.length,
      errorTypes,
      mostCommon: Object.keys(errorTypes).reduce((a, b) => errorTypes[a] > errorTypes[b] ? a : b, '')
    };
  }

  private aggregatePerformanceEvents(events: TelemetryEvent[]): any {
    if (events.length === 0) return {};

    const avgDuration = events.reduce((sum, e) => sum + e.data.duration, 0) / events.length;
    const avgMemoryUsage = events.reduce((sum, e) => sum + e.data.memoryUsage, 0) / events.length;
    const totalLinesProcessed = events.reduce((sum, e) => sum + e.data.linesProcessed, 0);

    return {
      avgDuration,
      avgMemoryUsage,
      totalLinesProcessed,
      operationsCount: events.length
    };
  }

  private countProfilesUsed(events: TelemetryEvent[]): any {
    const profiles = events.reduce((acc, e) => {
      const profile = e.data.profileUsed || 'unknown';
      acc[profile] = (acc[profile] || 0) + 1;
      return acc;
    }, {});

    return profiles;
  }

  private async generateReports(aggregated: any): Promise<void> {
    try {
      const reportsPath = path.join(path.dirname(this.telemetryPath), 'reports');
      if (!fs.existsSync(reportsPath)) {
        fs.mkdirSync(reportsPath, { recursive: true });
      }

      // Daily report
      const dailyReportPath = path.join(reportsPath, `daily_${this.getDateString()}.json`);
      await this.writeReport(dailyReportPath, aggregated, 'daily');

      // Weekly report (generated on Sundays)
      if (new Date().getDay() === 0) {
        const weeklyReportPath = path.join(reportsPath, `weekly_${this.getWeekString()}.json`);
        await this.writeReport(weeklyReportPath, aggregated, 'weekly');
      }
    } catch (error) {
      console.error('Failed to generate telemetry reports:', error);
    }
  }

  private async writeReport(filePath: string, data: any, type: string): Promise<void> {
    try {
      let existingData: any[] = [];
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(fileData);
      }

      existingData.push({
        type,
        timestamp: Date.now(),
        data
      });

      // Keep only last 30 reports
      const trimmedData = existingData.slice(-30);
      fs.writeFileSync(filePath, JSON.stringify(trimmedData, null, 2));
    } catch (error) {
      console.error(`Failed to write ${type} report:`, error);
    }
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getWeekString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.ceil((now - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
    return `${year}_W${week}`;
  }

  // Public methods for recording events
  recordConversion(data: ConversionTelemetryData): void {
    if (!this.isEnabled) return;

    this.addEvent({
      type: 'conversion',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data
    });
  }

  recordError(data: ErrorTelemetryData): void {
    if (!this.isEnabled) return;

    this.addEvent({
      type: 'error',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data
    });
  }

  recordPerformance(data: PerformanceTelemetryData): void {
    if (!this.isEnabled) return;

    this.addEvent({
      type: 'performance',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data
    });
  }

  recordUsage(data: UsageTelemetryData): void {
    if (!this.isEnabled) return;

    this.addEvent({
      type: 'usage',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data
    });
  }

  recordProfile(data: ProfileTelemetryData): void {
    if (!this.isEnabled) return;

    this.addEvent({
      type: 'profile',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data
    });
  }

  private addEvent(event: TelemetryEvent): void {
    this.events.push(event);

    // Flush if we have too many events in memory
    if (this.events.length >= this.MAX_EVENTS_IN_MEMORY) {
      this.flushEvents();
    }
  }

  // Analytics methods
  async getConversionStats(days: number = 7): Promise<any> {
    try {
      const events = await this.loadEvents();
      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      const recentEvents = events.filter(e => e.timestamp > cutoffTime && e.type === 'conversion');

      return this.aggregateConversionEvents(recentEvents);
    } catch (error) {
      console.error('Failed to get conversion stats:', error);
      return null;
    }
  }

  async getErrorStats(days: number = 7): Promise<any> {
    try {
      const events = await this.loadEvents();
      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      const recentEvents = events.filter(e => e.timestamp > cutoffTime && e.type === 'error');

      return this.aggregateErrorEvents(recentEvents);
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return null;
    }
  }

  async getPerformanceStats(days: number = 7): Promise<any> {
    try {
      const events = await this.loadEvents();
      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      const recentEvents = events.filter(e => e.timestamp > cutoffTime && e.type === 'performance');

      return this.aggregatePerformanceEvents(recentEvents);
    } catch (error) {
      console.error('Failed to get performance stats:', error);
      return null;
    }
  }

  private async loadEvents(): Promise<TelemetryEvent[]> {
    try {
      if (fs.existsSync(this.telemetryPath)) {
        const data = fs.readFileSync(this.telemetryPath, 'utf8');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Failed to load telemetry events:', error);
      return [];
    }
  }

  // Configuration methods
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isTelemetryEnabled(): boolean {
    return this.isEnabled;
  }

  // Cleanup methods
  async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = undefined;
    }

    await this.flushEvents();
  }

  async clearData(): Promise<void> {
    try {
      this.events = [];
      
      if (fs.existsSync(this.telemetryPath)) {
        fs.unlinkSync(this.telemetryPath);
      }

      const reportsPath = path.join(path.dirname(this.telemetryPath), 'reports');
      if (fs.existsSync(reportsPath)) {
        const files = fs.readdirSync(reportsPath);
        for (const file of files) {
          fs.unlinkSync(path.join(reportsPath, file));
        }
      }
    } catch (error) {
      console.error('Failed to clear telemetry data:', error);
    }
  }

  // Export/Import methods
  async exportData(filePath: string): Promise<boolean> {
    try {
      const events = await this.loadEvents();
      const exportData = {
        exportedAt: Date.now(),
        sessionId: this.sessionId,
        events
      };

      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to export telemetry data:', error);
      return false;
    }
  }

  async importData(filePath: string): Promise<boolean> {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const importData = JSON.parse(data);

      if (importData.events && Array.isArray(importData.events)) {
        await this.writeEventsToFile(importData.events);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to import telemetry data:', error);
      return false;
    }
  }
}

// Singleton instance getter
export function getTelemetryManager(context?: vscode.ExtensionContext): TelemetryManager {
  return TelemetryManager.getInstance(context);
}