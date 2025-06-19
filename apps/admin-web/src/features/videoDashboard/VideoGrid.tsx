import React from 'react';

/**
 * VideoDashboard: simple placeholder grid to avoid import errors.
 * Later you can replace each tile with your <VideoTile /> and logic.
 */
export const VideoDashboard: React.FC = () => {
  return (
    <div className="p-4">
      {/* Header */}
      <h2 className="text-2xl font-semibold mb-4">Video Dashboard</h2>

      {/* Placeholder grid: 3 columns on large screens, 2 on medium, 1 on small */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Example placeholder tiles */}
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-gray-200 dark:bg-gray-700 h-48 flex items-center justify-center rounded-lg"
          >
            <span className="text-gray-600 dark:text-gray-300">Tile {idx + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
