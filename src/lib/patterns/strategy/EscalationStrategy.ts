/**
 * Strategy Pattern (Behavioral)
 * 
 * Defines a family of interchangeable escalation algorithms, encapsulates each one,
 * and makes them interchangeable at runtime based on the incident severity.
 */

export interface EscalationResult {
  priorityLevel: 'P1-CRITICAL' | 'MEDIUM' | 'LOW';
  slaMinutes: number;
  formattedOutput: string;
  strategyUsed: string;
  actionProtocol: string;
}

export interface EscalationStrategy {
  readonly strategyName: string;
  processAlert(payload: { channel: string; rawMessage: string }): EscalationResult;
}

/**
 * Concrete Strategy: Critical Escalation
 * Computes P1-CRITICAL priority with 15-minute SLA target and urgent broadcast headers.
 */
export class CriticalEscalationStrategy implements EscalationStrategy {
  public readonly strategyName = 'CriticalEscalationStrategy';

  public processAlert(payload: { channel: string; rawMessage: string }): EscalationResult {
    const formatted = `[🚨 URGENT P1-CRITICAL | SLA: 15m] [TARGET: ${payload.channel.toUpperCase()}] ${payload.rawMessage.trim()} -- IMMEDIATELY PAGE PRIMARY ON-CALL SRE`;
    return {
      priorityLevel: 'P1-CRITICAL',
      slaMinutes: 15,
      formattedOutput: formatted,
      strategyUsed: this.strategyName,
      actionProtocol: 'Direct pager escalation, audio alarm dispatch, war room auto-provisioning.',
    };
  }
}

/**
 * Concrete Strategy: Warning Escalation
 * Computes MEDIUM priority with 120-minute SLA target and warning advisory tags.
 */
export class WarningEscalationStrategy implements EscalationStrategy {
  public readonly strategyName = 'WarningEscalationStrategy';

  public processAlert(payload: { channel: string; rawMessage: string }): EscalationResult {
    const formatted = `[⚠️ WARNING MEDIUM | SLA: 120m] [TARGET: ${payload.channel.toUpperCase()}] ${payload.rawMessage.trim()} -- Investigation ticket queued for triage`;
    return {
      priorityLevel: 'MEDIUM',
      slaMinutes: 120,
      formattedOutput: formatted,
      strategyUsed: this.strategyName,
      actionProtocol: 'Engineering triage channel post, asynchronous ticket creation with 2h SLA.',
    };
  }
}

/**
 * Concrete Strategy: Info Escalation
 * Computes LOW priority with 1440-minute (24h) SLA target and notice tags.
 */
export class InfoEscalationStrategy implements EscalationStrategy {
  public readonly strategyName = 'InfoEscalationStrategy';

  public processAlert(payload: { channel: string; rawMessage: string }): EscalationResult {
    const formatted = `[ℹ️ NOTICE LOW | SLA: 1440m] [TARGET: ${payload.channel.toUpperCase()}] ${payload.rawMessage.trim()} -- Logged for daily health digest`;
    return {
      priorityLevel: 'LOW',
      slaMinutes: 1440,
      formattedOutput: formatted,
      strategyUsed: this.strategyName,
      actionProtocol: 'Low-priority digest dispatch, non-intrusive broadcast, 24h review window.',
    };
  }
}

/**
 * Strategy Context
 * Maintains a reference to one of the concrete Strategy objects and delegates
 * execution of the escalation algorithm.
 */
export class EscalationContext {
  private strategy: EscalationStrategy;

  constructor(strategy: EscalationStrategy) {
    this.strategy = strategy;
  }

  /**
   * Allows hot-swapping strategies dynamically at runtime.
   */
  public setStrategy(strategy: EscalationStrategy): void {
    this.strategy = strategy;
  }

  public getStrategy(): EscalationStrategy {
    return this.strategy;
  }

  /**
   * Executes the currently active strategy algorithm.
   */
  public execute(payload: { channel: string; rawMessage: string }): EscalationResult {
    return this.strategy.processAlert(payload);
  }
}
