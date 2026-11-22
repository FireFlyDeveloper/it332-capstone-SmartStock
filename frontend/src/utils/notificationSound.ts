export interface NotificationSoundCandidate {
  type: string;
  severity: string;
}

export function isUrgentNotification(item: NotificationSoundCandidate): boolean {
  return item.type === 'stock' && item.severity === 'critical';
}

export interface NotificationAlertCandidate extends NotificationSoundCandidate {
  id: string;
}

export class NotificationAlertTracker {
  private seeded = false;
  private knownIds = new Set<string>();
  private knownStates = new Map<string, NotificationSoundCandidate>();

  isSeeded(): boolean {
    return this.seeded;
  }

  seed(knownIds: string[], visibleItems: NotificationAlertCandidate[]): void {
    this.knownIds = new Set([...knownIds, ...visibleItems.map((item) => item.id)].slice(-10_000));
    this.knownStates = new Map(visibleItems.map((item) => [item.id, { type: item.type, severity: item.severity }]));
    this.seeded = true;
  }

  getKnownIds(): string[] {
    return Array.from(this.knownIds).slice(-10_000);
  }

  observe(newCandidates: NotificationAlertCandidate[], visibleItems: NotificationAlertCandidate[]): { shouldSound: boolean } {
    if (!this.seeded) return { shouldSound: false };

    const newItems = newCandidates.filter((item) => !this.knownIds.has(item.id));
    const escalatedStockAlert = visibleItems.some((item) => {
      const previous = this.knownStates.get(item.id);
      return Boolean(previous && previous.severity !== 'critical' && isUrgentNotification(item));
    });

    for (const item of [...newItems, ...visibleItems]) {
      this.knownIds.add(item.id);
      this.knownStates.set(item.id, { type: item.type, severity: item.severity });
    }
    if (this.knownIds.size > 10_000) this.knownIds = new Set(Array.from(this.knownIds).slice(-10_000));
    if (this.knownStates.size > 10_000) this.knownStates = new Map(Array.from(this.knownStates).slice(-10_000));

    return { shouldSound: newItems.some(isUrgentNotification) || escalatedStockAlert };
  }
}

export function playUrgentNotificationSound(): void {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return;

  let context: AudioContext;
  try {
    context = new window.AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const endAt = context.currentTime + 0.16;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(740, context.currentTime);
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, endAt);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => { void context.close().catch(() => undefined); };
    oscillator.start();
    oscillator.stop(endAt);
    if (context.state === 'suspended') {
      void context.resume().catch(() => { void context.close().catch(() => undefined); });
    }
  } catch {
    // Sound is an optional local enhancement; notification delivery must still work without audio.
  }
}
