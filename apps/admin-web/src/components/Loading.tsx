import React from 'react';

export interface LoadingProps {
  /** the action to show in the subtitle */
  action: string;
}

const Loading: React.FC<LoadingProps> = ({ action }) => {
  return (
    <div
      className="
        absolute inset-0           /* fill the parent */
        flex flex-col
        items-center justify-center
        bg-[var(--color-primary)] /* purple background */
        text-[var(--color-white)]
        p-4
      "
    >
      <div role="status">
        <svg
          aria-hidden="true"
          className="
            w-12 h-12
            animate-spin
            text-[var(--color-primary-light)] /* light purple ring */
            fill-[var(--color-secondary)]     /* green inner arc */
          "
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591..."
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624..."
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>

      <div className="mt-4 text-2xl font-bold">Loading…</div>
      <div className="mt-2 text-center">
        Please wait while system <strong>{action}</strong>
      </div>
    </div>
  );
};

export default Loading;
