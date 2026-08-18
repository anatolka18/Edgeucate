import { Module } from '@nestjs/common';
import { PrometheusModule as NestPrometheusModule, makeCounterProvider, makeHistogramProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { PrometheusService } from './prometheus.service';
import { PrometheusController } from './prometheus.controller';

@Module({
  imports: [
    NestPrometheusModule.register({
      defaultMetrics: { enabled: true },
    }),
  ],
  controllers: [PrometheusController],
  providers: [
    PrometheusService,
    makeCounterProvider({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status_code'] }),
    makeHistogramProvider({ name: 'http_request_duration_seconds', help: 'HTTP request duration', labelNames: ['method', 'route', 'status_code'], buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5] }),
    makeCounterProvider({ name: 'http_request_errors_total', help: 'HTTP request errors', labelNames: ['method', 'route', 'error_type'] }),
    makeGaugeProvider({ name: 'websocket_connections_active', help: 'Active WebSocket connections', labelNames: ['type'] }),
    makeGaugeProvider({ name: 'webrtc_sessions_active', help: 'Active WebRTC sessions' }),
    makeCounterProvider({ name: 'users_registered_total', help: 'Registered users', labelNames: ['role'] }),
    makeCounterProvider({ name: 'avatar_uploads_total', help: 'Avatar uploads' }),
    makeCounterProvider({ name: 'advertisements_created_total', help: 'Advertisements created', labelNames: ['subject'] }),
    makeCounterProvider({ name: 'chat_messages_sent_total', help: 'Chat messages sent', labelNames: ['type'] }),
    makeCounterProvider({ name: 'video_calls_started_total', help: 'Video calls started' }),
    makeCounterProvider({ name: 'lessons_booked_total', help: 'Lessons booked' }),
    makeCounterProvider({ name: 'reviews_submitted_total', help: 'Reviews submitted', labelNames: ['rating'] }),
    makeCounterProvider({ name: 'search_queries_total', help: 'Search queries', labelNames: ['subject'] }),
    makeCounterProvider({ name: 'login_attempts_total', help: 'Login attempts', labelNames: ['status'] }),
    makeCounterProvider({ name: 'email_verifications_total', help: 'Email verifications' }),
    makeCounterProvider({ name: 'calendar_events_created_total', help: 'Calendar events created' }),
  ],
  exports: [NestPrometheusModule, PrometheusService],
})
export class PrometheusModule {}