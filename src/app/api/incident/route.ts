import { NextResponse } from 'next/server';
import { AuditLogger } from '@/lib/patterns/singleton/AuditLogger';
import {
  CriticalEscalationStrategy,
  WarningEscalationStrategy,
  InfoEscalationStrategy,
  EscalationContext,
  EscalationStrategy,
} from '@/lib/patterns/strategy/EscalationStrategy';
import { DispatcherFactory } from '@/lib/patterns/factory/DispatcherFactory';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channel, severity, message } = body;

    if (!channel || !severity || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: channel, severity, and message are required.' },
        { status: 400 }
      );
    }

    const validChannels = ['slack', 'pagerduty', 'email'] as const;
    const normalizedChannel = channel.toLowerCase() as (typeof validChannels)[number];
    if (!validChannels.includes(normalizedChannel)) {
      return NextResponse.json(
        { error: `Invalid channel "${channel}". Allowed: ${validChannels.join(', ')}` },
        { status: 400 }
      );
    }

    const validSeverities = ['critical', 'warning', 'info'] as const;
    const normalizedSeverity = severity.toLowerCase() as (typeof validSeverities)[number];
    if (!validSeverities.includes(normalizedSeverity)) {
      return NextResponse.json(
        { error: `Invalid severity "${severity}". Allowed: ${validSeverities.join(', ')}` },
        { status: 400 }
      );
    }

    // ==========================================
    // 1. STRATEGY PATTERN (Behavioral)
    // ==========================================
    let strategy: EscalationStrategy;
    switch (normalizedSeverity) {
      case 'critical':
        strategy = new CriticalEscalationStrategy();
        break;
      case 'warning':
        strategy = new WarningEscalationStrategy();
        break;
      case 'info':
        strategy = new InfoEscalationStrategy();
        break;
    }

    // Coordinate through EscalationContext
    const escalationContext = new EscalationContext(strategy);
    const escalationResult = escalationContext.execute({
      channel: normalizedChannel,
      rawMessage: message,
    });

    // ==========================================
    // 2. FACTORY PATTERN (Creational)
    // ==========================================
    // Controller never imports or directly instantiates SlackDispatcher, PagerDutyDispatcher, etc.
    const dispatcher = DispatcherFactory.createDispatcher(normalizedChannel);
    const receipt = dispatcher.dispatch(escalationResult);

    // ==========================================
    // 3. SINGLETON PATTERN (Creational)
    // ==========================================
    // Global in-memory instance logs the incident while retaining sessionInstanceId
    const logger = AuditLogger.getInstance();
    const newLogEntry = logger.log(
      normalizedChannel,
      escalationResult.priorityLevel,
      escalationResult.formattedOutput
    );

    return NextResponse.json({
      success: true,
      receipt,
      newLogEntry,
      currentLogs: logger.getLogs(),
      loggerSession: logger.sessionInstanceId,
      pipelineExecutionTrace: {
        strategy: {
          pattern: 'Strategy (Behavioral)',
          strategyClass: strategy.strategyName,
          priorityLevel: escalationResult.priorityLevel,
          slaMinutes: escalationResult.slaMinutes,
        },
        factory: {
          pattern: 'Factory (Creational)',
          factoryUsed: 'DispatcherFactory.createDispatcher()',
          dispatcherClass: receipt.dispatcherClass,
          channelName: dispatcher.channelName,
        },
        singleton: {
          pattern: 'Singleton (Creational)',
          instanceId: logger.sessionInstanceId,
          totalLoggedEvents: logger.getLogs().length,
        },
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function GET() {
  const logger = AuditLogger.getInstance();
  return NextResponse.json({
    loggerSession: logger.sessionInstanceId,
    totalLogs: logger.getLogs().length,
    currentLogs: logger.getLogs(),
  });
}

export async function DELETE() {
  const logger = AuditLogger.getInstance();
  logger.clear();
  return NextResponse.json({
    success: true,
    message: 'Audit log history cleared. Singleton sessionInstanceId remains persistent.',
    loggerSession: logger.sessionInstanceId,
    currentLogs: logger.getLogs(),
  });
}
