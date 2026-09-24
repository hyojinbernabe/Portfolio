// Arrow icon (viewBox 0 0 27 21), currentColor so it follows
// whatever text-color transition its parent runs.
export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 27 21" fill="currentColor" aria-hidden className={className}>
      <path d="M17.4819 20.5623L26.9771 10.3075L17.4819 0.0527344L15.431 1.91379L22.0776 8.97821H0.732422V11.6369H22.0776L15.431 18.7013L17.4819 20.5623Z" />
    </svg>
  );
}
