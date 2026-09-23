import { useToastStore, type ToastType } from '../toastStore.js';

const TYPE_CLASS: Record<ToastType, string> = {
  success: 'bg-accent-2-500 text-accent-2-900',
  error: 'bg-accent-500 text-bg',
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`rounded-2xl px-4 py-3 text-left text-sm shadow-lg ${TYPE_CLASS[t.type]}`}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
