import React from 'react';

/**
 * 403 Forbidden page.
 *
 * Shown when a logged-in user lacks the required role
 * to access a protected route.
 *
 * @returns A simple 403 message.
 */
const ForbiddenPage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full p-6">
    <h1 className="text-4xl font-bold text-red-600">403 – Forbidden</h1>
    <p className="mt-4 text-lg">You don’t have permission to view this page.</p>
  </div>
);

export default ForbiddenPage;
