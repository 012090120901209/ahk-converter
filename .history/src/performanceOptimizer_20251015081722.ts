import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PerformanceOptions, ConversionProfile } from './conversionProfiles';

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: number;
  linesProcessed: number;
  chunksProcessed: number;
  averageChunkTime: number;
  peakMemoryUsage: number;
}

export interface ProcessingChunk {
  id: string;
  content: string;
  startLine: number;
  endLine: number;
  size: number;
  processingTime?: number;
}

export interface ProgressReport {
  current: number;
  total: number;
  percentage: number;
  message: string;
  chunk?: ProcessingChunk;
  metrics?: PerformanceMetrics;
}

export class PerformanceOptimizer {
  private progress?: vscode.Progress<{ message?: string; increment?: number }>;
  private cancellationToken?: vscode.CancellationToken;
  private metrics: PerformanceMetrics;
  private chunks: ProcessingChunk[] = [];
  private memoryMonitorInterval?: NodeJS.Timeout;

  constructor(
    private options: PerformanceOptions,
    private profile: ConversionProfile
  ) {
    this.metrics = {
      startTime: Date.now(),
      linesProcessed: 0,
      chunksProcessed: 0,
      averageChunkTime: 0,
      peakMemoryUsage: 0
    };
  }

  async processLargeFile(
    content: string,
    progress?: vscode.Progress<{ message?: string; increment?: number }>,
    token?: vscode.CancellationToken
  ): Promise<{ result: string; metrics: PerformanceMetrics }> {
    this.progress = progress;
    this.cancellationToken = token;

    try {
      // Start memory monitoring
      this.startMemoryMonitoring();

      if (this.options.streamingEnabled && this.shouldUseStreaming(content)) {
        return await this.processWithStreaming(content);
      } else {
        return await this.processInChunks(content);
      }
    } finally {
      // Stop memory monitoring
      this.stopMemoryMonitoring();
      
      // Finalize metrics
      this.metrics.endTime = Date.now();
      this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    }
  }

  private shouldUseStreaming(content: string): boolean {
    const lines = content.split('\n').length;
    const estimatedSize = Buffer.byteLength(content, 'utf8') / (1024 * 1024); // MB
    
    return lines > 1000 || estimatedSize > 5; // Use streaming for large files
  }

  private async processInChunks(content: string): Promise<{ result: string; metrics: PerformanceMetrics }> {
    const lines = content.split('\n');
    const totalLines = lines.length;
    const chunkSize = this.options.chunkSize;
    
    this.chunks = this.createChunks(lines, chunkSize);
    const results: string[] = [];

    for (let i = 0; i < this.chunks.length; i++) {
      if (this.cancellationToken?.isCancellationRequested) {
        throw new Error('Processing cancelled by user');
      }

      const chunk = this.chunks[i];
      const startTime = Date.now();

      // Update progress
      this.updateProgress(i + 1, this.chunks.length, `Processing chunk ${i + 1}/${this.chunks.length}`);

      // Process chunk
      const processedChunk = await this.processChunk(chunk);
      results.push(processedChunk);

      // Update metrics
      const processingTime = Date.now() - startTime;
      chunk.processingTime = processingTime;
      this.updateMetrics(chunk, processingTime);

      // Check memory usage
      if (this.options.maxMemoryUsage > 0) {
        const currentMemory = this.getCurrentMemoryUsage();
        if (currentMemory > this.options.maxMemoryUsage) {
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        }
      }
    }

    return {
      result: results.join('\n'),
      metrics: this.metrics
    };
  }

  private async processWithStreaming(content: string): Promise<{ result: string; metrics: PerformanceMetrics }> {
    const lines = content.split('\n');
    const totalLines = lines.length;
    const chunkSize = Math.min(this.options.chunkSize, 100); // Smaller chunks for streaming
    
    const results: string[] = [];
    let currentChunk: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (this.cancellationToken?.isCancellationRequested) {
        throw new Error('Processing cancelled by user');
      }

      currentChunk.push(lines[i]);

      // Process chunk when it reaches the desired size or at the end
      if (currentChunk.length >= chunkSize || i === lines.length - 1) {
        const chunkContent = currentChunk.join('\n');
        const chunk: ProcessingChunk = {
          id: `stream_${i}`,
          content: chunkContent,
          startLine: i - currentChunk.length + 1,
          endLine: i,
          size: Buffer.byteLength(chunkContent, 'utf8')
        };

        const startTime = Date.now();
        const processedChunk = await this.processChunk(chunk);
        const processingTime = Date.now() - startTime;

        results.push(processedChunk);
        this.updateMetrics(chunk, processingTime);

        // Update progress
        const progressPercentage = ((i + 1) / totalLines) * 100;
        this.updateProgress(progressPercentage, 100, `Streaming progress: ${i + 1}/${totalLines} lines`);

        // Clear current chunk to free memory
        currentChunk = [];
      }
    }

    return {
      result: results.join('\n'),
      metrics: this.metrics
    };
  }

  private createChunks(lines: string[], chunkSize: number): ProcessingChunk[] {
    const chunks: ProcessingChunk[] = [];
    
    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunkLines = lines.slice(i, i + chunkSize);
      const content = chunkLines.join('\n');
      
      chunks.push({
        id: `chunk_${Math.floor(i / chunkSize)}`,
        content,
        startLine: i,
        endLine: Math.min(i + chunkSize - 1, lines.length - 1),
        size: Buffer.byteLength(content, 'utf8')
      });
    }
    
    return chunks;
  }

  private async processChunk(chunk: ProcessingChunk): Promise<string> {
    // Apply conversion rules to the chunk
    let processedContent = chunk.content;
    
    for (const rule of this.profile.rules) {
      if (!rule.enabled) continue;
      
      try {
        processedContent = this.applyRule(processedContent, rule);
      } catch (error) {
        console.error(`Error applying rule ${rule.id}:`, error);
        // Continue with other rules even if one fails
      }
    }
    
    return processedContent;
  }

  private applyRule(content: string, rule: any): string {
    if (rule.pattern && rule.replacement) {
      const regex = new RegExp(rule.pattern, 'g');
      return content.replace(regex, rule.replacement);
    }
    
    if (rule.customLogic) {
      // For custom logic, we would need to evaluate it safely
      // This is a placeholder for future implementation
      return content;
    }
    
    return content;
  }

  private updateProgress(current: number, total: number, message: string): void {
    if (!this.progress || !this.options.enableProgressTracking) return;
    
    const percentage = (current / total) * 100;
    const increment = percentage - (this.metrics.chunksProcessed / total) * 100;
    
    this.progress.report({
      message,
      increment: Math.max(0, increment)
    });
  }

  private updateMetrics(chunk: ProcessingChunk, processingTime: number): void {
    this.metrics.chunksProcessed++;
    this.metrics.linesProcessed += (chunk.endLine - chunk.startLine + 1);
    
    // Update average chunk time
    this.metrics.averageChunkTime = 
      (this.metrics.averageChunkTime * (this.metrics.chunksProcessed - 1) + processingTime) / 
      this.metrics.chunksProcessed;
  }

  private startMemoryMonitoring(): void {
    if (!this.options.enableProgressTracking) return;
    
    this.memoryMonitorInterval = setInterval(() => {
      const currentMemory = this.getCurrentMemoryUsage();
      this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, currentMemory);
      
      // Check if we're approaching memory limit
      if (this.options.maxMemoryUsage > 0 && currentMemory > this.options.maxMemoryUsage * 0.9) {
        console.warn(`Approaching memory limit: ${currentMemory}MB / ${this.options.maxMemoryUsage}MB`);
      }
    }, 1000); // Check every second
  }

  private stopMemoryMonitoring(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = undefined;
    }
  }

  private getCurrentMemoryUsage(): number {
    if (process.memoryUsage) {
      const usage = process.memoryUsage();
      return usage.heapUsed / (1024 * 1024); // Convert to MB
    }
    return 0;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getChunks(): ProcessingChunk[] {
    return [...this.chunks];
  }

  // Utility method to estimate processing time
  static estimateProcessingTime(content: string, options: PerformanceOptions): number {
    const lines = content.split('\n').length;
    const size = Buffer.byteLength(content, 'utf8');
    
    // Base estimation: 1ms per line + 0.1ms per KB
    const baseTime = lines + (size / 1024) * 0.1;
    
    // Adjust for streaming
    const streamingMultiplier = options.streamingEnabled ? 0.8 : 1.0;
    
    // Adjust for chunk size
    const chunkMultiplier = options.chunkSize < 500 ? 1.2 : options.chunkSize > 1000 ? 0.9 : 1.0;
    
    return Math.ceil(baseTime * streamingMultiplier * chunkMultiplier);
  }

  // Utility method to check if processing should be cancelled
  shouldCancel(): boolean {
    return this.cancellationToken?.isCancellationRequested || false;
  }

  // Method to optimize memory usage
  optimizeMemory(): void {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Clear chunk cache if it's getting too large
    if (this.chunks.length > 100) {
      this.chunks = this.chunks.slice(-50); // Keep only last 50 chunks
    }
  }
}

export class PerformanceReporter {
  static generateReport(metrics: PerformanceMetrics): string {
    const report = [
      '=== Performance Report ===',
      `Duration: ${metrics.duration}ms`,
      `Lines Processed: ${metrics.linesProcessed}`,
      `Chunks Processed: ${metrics.chunksProcessed}`,
      `Average Chunk Time: ${metrics.averageChunkTime.toFixed(2)}ms`,
      `Peak Memory Usage: ${metrics.peakMemoryUsage.toFixed(2)}MB`,
      `Lines per Second: ${(metrics.linesProcessed / (metrics.duration! / 1000)).toFixed(2)}`,
      '========================'
    ];
    
    return report.join('\n');
  }

  static generateDetailedReport(metrics: PerformanceMetrics, chunks: ProcessingChunk[]): string {
    const report = [
      '=== Detailed Performance Report ===',
      `Total Duration: ${metrics.duration}ms`,
      `Lines Processed: ${metrics.linesProcessed}`,
      `Chunks Processed: ${metrics.chunksProcessed}`,
      `Average Chunk Time: ${metrics.averageChunkTime.toFixed(2)}ms`,
      `Peak Memory Usage: ${metrics.peakMemoryUsage.toFixed(2)}MB`,
      '',
      '=== Chunk Details ==='
    ];
    
    chunks.forEach((chunk, index) => {
      report.push(`Chunk ${index + 1}:`);
      report.push(`  Lines: ${chunk.startLine}-${chunk.endLine}`);
      report.push(`  Size: ${(chunk.size / 1024).toFixed(2)}KB`);
      report.push(`  Processing Time: ${chunk.processingTime || 'N/A'}ms`);
      report.push('');
    });
    
    report.push('========================');
    
    return report.join('\n');
  }
}