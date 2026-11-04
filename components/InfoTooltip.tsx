import React, { useId, useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

/** Explanation bubble: opens on hover, keyboard focus or tap; the text is linked to the button for screen readers. */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  const [show, setShow] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-block ml-2 align-middle">
      <button
        type="button"
        aria-label="More information"
        aria-describedby={id}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={() => setShow(true)} // a tap opens it (mouseenter/focus already fired); blur, Escape or mouseleave close it
        onKeyDown={(e) => e.key === 'Escape' && setShow(false)}
        className="text-gray-400 hover:text-blue-500 focus:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full transition-colors"
      >
        <Info size={16} />
      </button>
      <span
        id={id}
        role="tooltip"
        className={`${show ? 'block' : 'hidden'} absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs font-normal normal-case rounded shadow-lg z-50 pointer-events-none`}
      >
        {text}
        <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></span>
      </span>
    </span>
  );
};
