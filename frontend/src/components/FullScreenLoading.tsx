interface FullScreenLoadingProps {
  label?: string;
  overlay?: boolean;
}

export function FullScreenLoading({ label = 'Loading SmartStock...', overlay = false }: FullScreenLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${overlay ? 'fixed inset-0 z-[100] ' : ''}flex min-h-[100dvh] items-center justify-center bg-surface-2`}
    >
      <div className="font-mono text-xs uppercase tracking-[0.22em] text-text-muted">{label}</div>
    </div>
  );
}
