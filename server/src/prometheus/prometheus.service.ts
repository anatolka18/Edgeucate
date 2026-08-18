import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class PrometheusService {
  constructor(
    @InjectMetric('http_requests_total') private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('http_request_duration_seconds') private readonly httpRequestDuration: Histogram<string>,
    @InjectMetric('http_request_errors_total') private readonly httpRequestErrors: Counter<string>,
    @InjectMetric('websocket_connections_active') private readonly websocketConnections: Gauge<string>,
    @InjectMetric('webrtc_sessions_active') private readonly webrtcSessions: Gauge<string>,
    @InjectMetric('users_registered_total') private readonly usersRegistered: Counter<string>,
    @InjectMetric('avatar_uploads_total') private readonly avatarUploads: Counter<string>,
    @InjectMetric('advertisements_created_total') private readonly advertisementsCreated: Counter<string>,
    @InjectMetric('chat_messages_sent_total') private readonly chatMessagesSent: Counter<string>,
    @InjectMetric('video_calls_started_total') private readonly videoCallsStarted: Counter<string>,
    @InjectMetric('lessons_booked_total') private readonly lessonsBooked: Counter<string>,
    @InjectMetric('reviews_submitted_total') private readonly reviewsSubmitted: Counter<string>,
    @InjectMetric('search_queries_total') private readonly searchQueries: Counter<string>,
    @InjectMetric('login_attempts_total') private readonly loginAttempts: Counter<string>,
    @InjectMetric('email_verifications_total') private readonly emailVerifications: Counter<string>,
    @InjectMetric('calendar_events_created_total') private readonly calendarEventsCreated: Counter<string>,
  ) {}

  incrementHttpRequests(method: string, route: string, statusCode: string): void {
    this.httpRequestsTotal.labels(method, route, statusCode).inc();
  }
  observeHttpRequestDuration(method: string, route: string, statusCode: string, duration: number): void {
    this.httpRequestDuration.labels(method, route, statusCode).observe(duration);
  }
  incrementHttpRequestErrors(method: string, route: string, errorType: string): void {
    this.httpRequestErrors.labels(method, route, errorType).inc();
  }
  setWebsocketConnections(type: string, count: number): void {
    this.websocketConnections.labels(type).set(count);
  }
  incrementWebsocketConnections(type: string): void {
    this.websocketConnections.labels(type).inc();
  }
  decrementWebsocketConnections(type: string): void {
    this.websocketConnections.labels(type).dec();
  }
  setWebRtcSessions(count: number): void {
    this.webrtcSessions.set(count);
  }
  incrementWebRtcSessions(): void { this.webrtcSessions.inc(); }
  decrementWebRtcSessions(): void { this.webrtcSessions.dec(); }

  incrementUserRegistered(role: string): void { this.usersRegistered.labels(role).inc(); }
  incrementAvatarUploads(): void { this.avatarUploads.inc(); }
  incrementAdvertisementCreated(subject: string): void { this.advertisementsCreated.labels(subject).inc(); }
  incrementChatMessageSent(type: string): void { this.chatMessagesSent.labels(type).inc(); }
  incrementVideoCallStarted(): void { this.videoCallsStarted.inc(); }
  incrementLessonBooked(): void { this.lessonsBooked.inc(); }
  incrementReviewSubmitted(rating: string): void { this.reviewsSubmitted.labels(rating).inc(); }
  incrementSearchQuery(subject: string): void { this.searchQueries.labels(subject).inc(); }
  incrementLoginAttempts(status: string): void { this.loginAttempts.labels(status).inc(); }
  incrementEmailVerifications(): void { this.emailVerifications.inc(); }
  incrementCalendarEventCreated(): void { this.calendarEventsCreated.inc(); }
}