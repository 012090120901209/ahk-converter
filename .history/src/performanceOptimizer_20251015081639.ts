
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
