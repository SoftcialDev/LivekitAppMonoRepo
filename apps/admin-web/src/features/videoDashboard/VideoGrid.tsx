import React from 'react';

/**
 * VideoDashboard component:
 * Renders a simple placeholder grid of video tiles.
 * This is a stub implementation; replace each placeholder tile with
 * a <VideoTile /> or other logic when integrating real data.
 *
 * @component
 * @example
 * <VideoDashboard />
 *
 * @returns {JSX.Element} The video dashboard UI with a header and a responsive grid of tiles.
 */
export const VideoDashboard: React.FC = () => {
  // Number of placeholder tiles to render.
  const tileCount = 6;

  return (
    <div className="p-4">
      {/* Header */}
      <h2 className="text-2xl font-semibold mb-4">Video Dashboard</h2>

      {/* 
        Responsive grid container:
        - grid-cols-1 on small screens
        - md:grid-cols-2 on medium screens
        - lg:grid-cols-3 on large screens
        Gap of 4 between items.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: tileCount }).map((_, idx) => {
          // idx is the zero-based index of the tile
          const tileNumber = idx + 1;

          /**
           * Each placeholder tile:
           * - key: idx (unique within this list)
           * - background: light gray in light mode, darker gray in dark mode
           * - fixed height of 48 (h-48)
           * - centers its content both vertically and horizontally
           * - rounded corners
           *
           * Replace the contents of this <div> with actual video tile content.
           */
          return (
            <div
              key={idx}
              className="bg-gray-200 dark:bg-gray-700 h-48 flex items-center justify-center rounded-lg"
            >
              {/* Placeholder text showing tile number */}
              <span className="text-gray-600 dark:text-gray-300">
                Tile {tileNumber}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
