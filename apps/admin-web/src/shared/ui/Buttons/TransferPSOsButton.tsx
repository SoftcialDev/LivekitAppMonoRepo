import React from 'react';

export interface TransferPSOsButtonProps {
  /**
   * Click handler for the transfer button.
   * @param event The click event.
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * TransferPSOsButton
 *
 * A standalone “transfer PSOs” icon button using only the provided SVG.
 * - No hover effects.
 * - No extra padding or styles beyond making it clickable (`cursor-pointer`).
 *
 * @param props.onClick Optional click handler.
 * @returns A button wrapping the transfer SVG.
 */
const TransferPSOsButton: React.FC<TransferPSOsButtonProps> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="cursor-pointer p-0 m-0"
  >
    <svg
      height="40px"
      width="40px"
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 489.80 489.80"
      fill="#ABDE80"
      stroke="#ABDE80"
      strokeWidth="0.004898"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0" />
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#CCCCCC"
        strokeWidth="0.9796"
      />
      <g id="SVGRepo_iconCarrier">
        <g>
          <g>
            <path
              id="XMLID_798_"
              d="M480.7,454.75v-24.7c0-5.2-2.3-10.2-6.3-13.5c-22.3-18.3-46.3-30.5-51.2-32.9
                c-0.6-0.3-0.9-0.8-0.9-1.4v-34.7c4.4-2.9,7.2-7.9,7.2-13.5v-36c0-17.9-14.5-32.4-32.4-32.4h-3.9h-3.9
                c-17.9,0-32.4,14.5-32.4,32.4v36c0,5.6,2.9,10.6,7.2,13.5v34.7c0,0.6-0.3,1.2-0.9,1.4
                c-4.9,2.4-28.9,14.5-51.2,32.9c-4,3.3-6.3,8.3-6.3,13.5v24.7"
            />
            <path
              d="M96.8,234.35c-5,0-9.1,4.1-9.1,9.1v36c0,42.9,34.9,77.8,77.8,77.8h114.4l-15,15
                c-3.5,3.5-3.5,9.3,0,12.8c1.8,1.8,4.1,2.7,6.4,2.7s4.6-0.9,6.4-2.7l30.4-30.4
                c1.7-1.7,2.7-4,2.7-6.4s-1-4.7-2.7-6.4l-30.4-30.4c-3.5-3.5-9.3-3.5-12.8,0
                s-3.5,9.3,0,12.8l15,15H165.5c-32.9,0-59.7-26.8-59.7-59.7v-36
                C105.8,238.35,101.8,234.35,96.8,234.35z"
            />
            <path
              d="M211.7,147.05c1.8,1.8,4.1,2.7,6.4,2.7c2.3,0,4.6-0.9,6.4-2.7c3.5-3.5,3.5-9.3,0-12.8l-15-15h114.9
                c32.9,0,59.7,26.8,59.7,59.7v36c0,5,4.1,9.1,9.1,9.1s9.1-4.1,9.1-9.1v-36
                c0-42.9-34.9-77.8-77.8-77.8H209.6l15-15c3.5-3.5,3.5-9.3,0-12.8
                s-9.3-3.5-12.8,0l-30.4,30.4c-1.7,1.7-2.7,4-2.7,6.4s1,4.7,2.7,6.4
                L211.7,147.05z"
            />
            <path
              d="M9.3,233.25c5,0,9.1-4.1,9.1-9.1v-24.7c0-2.5,1.1-4.9,3-6.5c21.6-17.7,45-29.5,49.4-31.7
                c3.6-1.8,6-5.5,6-9.6v-34.7c0-3-1.5-5.9-4-7.5c-2-1.3-3.2-3.6-3.2-6v-36
                c0-12.9,10.5-23.4,23.3-23.4h7.7c12.9,0,23.3,10.5,23.3,23.4v36
                c0,2.4-1.2,4.6-3.2,6c-2.5,1.7-4,4.5-4,7.5v34.7c0,4,2.3,7.8,6,9.6
                c4.5,2.2,27.9,14,49.4,31.7c1.9,1.6,3,3.9,3,6.5v24.7c0,5,4.1,9.1,9.1,9.1
                s9.1-4.1,9.1-9.1v-24.7c0-8-3.5-15.4-9.7-20.5
                c-19.1-15.7-39.6-27.1-48.8-31.9v-25.9c4.6-4.7,7.2-11,7.2-17.7v-36
                c0-22.9-18.6-41.5-41.5-41.5h-7.7c-22.9,0-41.5,18.6-41.5,41.5v36
                c0,6.7,2.6,13,7.2,17.7v25.9C-30.4,382.45-50.1,393.85-69.3,409.55z"
            />
          </g>
        </g>
      </g>
    </svg>
  </button>
);

export default TransferPSOsButton;
