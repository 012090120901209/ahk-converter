
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
