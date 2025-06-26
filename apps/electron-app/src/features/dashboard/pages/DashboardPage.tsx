
import React from "react";
/**
 * DashboardPage
 *
 * After login, shows the user’s video stream centered on screen.
 * Uses CSS variables (from your global stylesheet) and Tailwind for layout.
 *
 * @returns {JSX.Element}
 */
export const DashboardPage: React.FC = () => {
  return (
    <div
      className="w-screen h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--color-primary-dark)" }}
    >
      <video
        className="w-80 h-80 rounded-2xl shadow-lg"
        autoPlay
        muted
        playsInline
        /* 
         * You’ll attach your MediaStream to this <video> element 
         * once you have it (e.g. via ref or state).
         */
      />
    </div>
  );
};

export default DashboardPage;
