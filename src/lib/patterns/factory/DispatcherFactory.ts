import { EscalationResult } from '../strategy/EscalationStrategy';

/**
 * Factory Pattern (Creational)
 * 
 * Provides an interface for creating notification dispatchers without exposing
 * the concrete dispatcher classes directly to the controller or caller.
 */

export interface DispatchReceipt {
  receiptId: string;
  channel: string;
  timestamp: string;
  status: 'DELIVERED' | 'DISPATCHED' | 'QUEUED';
  targetEndpoint: string;
  payloadDelivered: EscalationResult;
  dispatcherClass: string;
  metadata: Record<string, unknown>;
}

/**
 * Common Product Interface
 */
export interface AlertDispatcher {
  readonly channelName: string;
  dispatch(alert: EscalationResult): DispatchReceipt;
}

/**
 * Concrete Product 1: Slack Dispatcher (internal to module)
 * Mocks delivery to a Slack webhook with block kit styling.
 */
class SlackDispatcher implements AlertDispatcher {
  public readonly channelName = 'Slack';

  public dispatch(alert: EscalationResult): DispatchReceipt {
    return {
      receiptId: `slack_rcpt_${Math.random().toString(36).substring(2, 9)}`,
      channel: 'slack',
      timestamp: new Date().toISOString(),
      status: 'DELIVERED',
      targetEndpoint: 'https://hooks.slack.com/services/T00/B00/X-PROD-INCIDENTS',
      payloadDelivered: alert,
      dispatcherClass: 'SlackDispatcher',
      metadata: {
        protocol: 'HTTPS POST Webhook',
        payloadFormat: 'Slack Block Kit (Markdown + Buttons)',
        channelTarget: '#incident-response-live',
        ackRequired: alert.priorityLevel === 'P1-CRITICAL',
      },
    };
  }
}

/**
 * Concrete Product 2: PagerDuty Dispatcher (internal to module)
 * Mocks urgent phone/push notification to on-call schedules.
 */
class PagerDutyDispatcher implements AlertDispatcher {
  public readonly channelName = 'PagerDuty';

  public dispatch(alert: EscalationResult): DispatchReceipt {
    return {
      receiptId: `pd_rcpt_${Math.random().toString(36).substring(2, 9)}`,
      channel: 'pagerduty',
      timestamp: new Date().toISOString(),
      status: 'DELIVERED',
      targetEndpoint: 'https://events.pagerduty.com/v2/enqueue',
      payloadDelivered: alert,
      dispatcherClass: 'PagerDutyDispatcher',
      metadata: {
        urgency: alert.priorityLevel === 'P1-CRITICAL' ? 'high' : 'low',
        routingKey: 'pd_srv_key_8849204b',
        escalationPolicy: 'Tier 1 Primary SRE -> Tier 2 Staff SRE',
        voiceCallTriggered: alert.priorityLevel === 'P1-CRITICAL',
      },
    };
  }
}

/**
 * Concrete Product 3: Email Dispatcher (internal to module)
 * Mocks dispatching via TLS internal relay.
 */
class EmailDispatcher implements AlertDispatcher {
  public readonly channelName = 'Email';

  public dispatch(alert: EscalationResult): DispatchReceipt {
    return {
      receiptId: `email_rcpt_${Math.random().toString(36).substring(2, 9)}`,
      channel: 'email',
      timestamp: new Date().toISOString(),
      status: 'DISPATCHED',
      targetEndpoint: 'smtp://relay.internal.infrastructure:587 (STARTTLS)',
      payloadDelivered: alert,
      dispatcherClass: 'EmailDispatcher',
      metadata: {
        sender: 'alerts@incident-response.cloud.internal',
        recipientGroup: 'sre-oncall-list@company.internal',
        encryption: 'TLSv1.3 AES-256-GCM',
        importance: alert.priorityLevel === 'P1-CRITICAL' ? 'High' : 'Normal',
      },
    };
  }
}

/**
 * Factory Class
 * Exposes a single parameterized creation method, insulating the consumer
 * from concrete dispatcher implementations.
 */
export class DispatcherFactory {
  public static createDispatcher(channelType: 'slack' | 'pagerduty' | 'email'): AlertDispatcher {
    switch (channelType.toLowerCase()) {
      case 'slack':
        return new SlackDispatcher();
      case 'pagerduty':
        return new PagerDutyDispatcher();
      case 'email':
        return new EmailDispatcher();
      default:
        throw new Error(`Unsupported channel type for DispatcherFactory: "${channelType}"`);
    }
  }
}
