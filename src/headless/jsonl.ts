import fs from 'node:fs';
import { SnapshotOutput, SimEvent, EndOutput } from '../core/entities.js';

export class JsonlWriter {
  private filePath: string;
  private fileHandle: number;

  constructor(filePath: string) {
    this.filePath = filePath;
    // Open file and truncate if exists
    this.fileHandle = fs.openSync(this.filePath, 'w');
  }

  public writeLine(data: unknown): void {
    const line = JSON.stringify(data) + '\n';
    fs.writeSync(this.fileHandle, line);
  }

  public writeSnapshot(snapshot: SnapshotOutput): void {
    this.writeLine(snapshot);
  }

  public writeEvent(event: SimEvent): void {
    this.writeLine(event);
  }

  public writeEnd(end: EndOutput): void {
    this.writeLine(end);
  }

  public close(): void {
    fs.closeSync(this.fileHandle);
  }
}
