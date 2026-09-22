/**
 * Singleton Pattern (Creational)
 * 
 * Ensures that exactly one instance of AuditLogger exists within the runtime
 * environment. All dispatches share this central log repository and the same
 * sessionInstanceId across distinct HTTP requests.
 */

export interface LogEntry {
  id: string;
  timestamp: string;
  channel: string;
  severity: string;
  message: string;
  sessionInstanceId: string;
}

export class AuditLogger {
  private static instance: AuditLogger | null = null;
  public readonly sessionInstanceId: string;
  private logs: LogEntry[] = [];

  /**
   * Private constructor prevents direct instantiation using `new AuditLogger()`.
   */
  private constructor() {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    this.sessionInstanceId = `logger_${randomSuffix}_${timestamp}`;
    console.log(`[AuditLogger Singleton] Initialized new session instance: ${this.sessionInstanceId}`);
  }

  /**
   * Static method to access the single AuditLogger instance.
   * Leverages globalThis in development to preserve the singleton across Next.js HMR reloads.
   */
  public static getInstance(): AuditLogger {
    // Preserve singleton across hot reloads in Next.js development server
    const globalRef = globalThis as unknown as { __auditLoggerInstance?: AuditLogger };

    if (!AuditLogger.instance) {
      if (globalRef.__auditLoggerInstance) {
        AuditLogger.instance = globalRef.__auditLoggerInstance;
      } else {
        AuditLogger.instance = new AuditLogger();
        globalRef.__auditLoggerInstance = AuditLogger.instance;
      }
    }

    return AuditLogger.instance;
  }

  /**
   * Appends an event to the in-memory audit log.
   */
  public log(channel: string, severity: string, message: string): LogEntry {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      channel,
      severity,
      message,
      sessionInstanceId: this.sessionInstanceId,
    };

    this.logs.unshift(entry); // Most recent first
    return entry;
  }

  /**
   * Returns a snapshot copy of all audit logs.
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clears the log history while preserving the same sessionInstanceId.
   */
  public clear(): void {
    this.logs = [];
  }
}
