
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
    
