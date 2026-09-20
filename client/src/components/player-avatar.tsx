import type { FC } from 'react';

interface PlayerAvatarProps {
  imageUrl?: string | null;
  skinTone?: string | null;
  hairColor?: string | null;
  hairStyle?: string | null;
  facialHair?: string | null;
  className?: string;
}

export const PlayerAvatar: FC<PlayerAvatarProps> = ({ 
  imageUrl,
  skinTone = "#E0AC69", 
  hairColor = "#000000", 
  hairStyle = "short",
  facialHair = "none",
  className = "" 
}) => {
  if (imageUrl) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center overflow-hidden`}>
        <img src={imageUrl} alt="Player" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background/Shadow */}
      <circle cx="50" cy="50" r="48" fill="currentColor" className="text-muted/20" />
      
      {/* Realistic Body/Shoulders */}
      <path 
        d="M10 95 C10 75 25 65 50 65 C75 65 90 75 90 95" 
        fill="#222" 
      />
      <path 
        d="M20 95 C20 80 30 72 50 72 C70 72 80 80 80 95" 
        fill="#333" 
      />
      
      {/* Neck */}
      <path d="M42 65 L42 75 Q50 80 58 75 L58 65 Z" fill={skinTone || "#E0AC69"} />
      
      {/* Realistic Head Shape */}
      <path 
        d="M32 45 C32 20 68 20 68 45 C68 68 50 80 32 65 Z" 
        fill={skinTone || "#E0AC69"} 
        className="brightness-95"
      />
      <path 
        d="M32 45 C32 22 68 22 68 45 L68 60 C68 72 32 72 32 60 Z" 
        fill={skinTone || "#E0AC69"} 
      />
      
      {/* Hair Styles */}
      {hairStyle === "short" && (
        <path 
          d="M30 44 C30 22 70 22 70 44 Q70 42 60 42 L40 42 Q30 42 30 44" 
          fill={hairColor || "#000000"} 
        />
      )}
      {hairStyle === "buzz" && (
        <path 
          d="M30 44 C30 27 70 27 70 44 Q70 43 60 43 L40 43 Q30 43 30 44" 
          fill={hairColor || "#000000"} 
          opacity="0.8"
        />
      )}
      {hairStyle === "long" && (
        <g fill={hairColor || "#000000"}>
          <path d="M30 44 C25 44 25 75 30 75 L35 75 L35 44 Z" />
          <path d="M70 44 C75 44 75 75 70 75 L65 75 L65 44 Z" />
          <path d="M30 44 C30 22 70 22 70 44 Q70 42 60 42 L40 42 Q30 42 30 44" />
        </g>
      )}
      {hairStyle === "dreads" && (
        <g fill={hairColor || "#000000"}>
          <path d="M30 44 C30 22 70 22 70 44 Q70 42 60 42 L40 42 Q30 42 30 44" />
          {[28, 33, 67, 72].map(x => (
            <rect key={x} x={x-2} y="44" width="4" height="25" rx="2" />
          ))}
        </g>
      )}
      {hairStyle === "afro" && (
        <path 
          d="M25 44 A25 25 0 1 1 75 44 Q75 42 60 42 L40 42 Q25 42 25 44" 
          fill={hairColor || "#000000"} 
        />
      )}
      
      {/* Facial Hair */}
      {facialHair === "beard" && (
        <path 
          d="M30 60 C30 75 70 75 70 60 C70 70 30 70 30 60" 
          fill={hairColor || "#000000"} 
          opacity="0.6"
        />
      )}
      {facialHair === "goatee" && (
        <path 
          d="M40 65 C40 75 60 75 60 65 C55 68 45 68 40 65" 
          fill={hairColor || "#000000"} 
          opacity="0.6"
        />
      )}
      {facialHair === "stubble" && (
        <path 
          d="M30 60 C30 75 70 75 70 60 C70 70 30 70 30 60" 
          fill={hairColor || "#000000"} 
          opacity="0.2"
        />
      )}
      {facialHair === "mustache" && (
        <path 
          d="M40 62 C40 60 60 60 60 62 C55 63 45 63 40 62" 
          fill={hairColor || "#000000"} 
          opacity="0.8"
        />
      )}
      
      {/* Eyes */}
      <ellipse cx="40" cy="48" rx="3" ry="4" fill="white" />
      <circle cx="40.5" cy="48.5" r="1.5" fill="#333" />
      <ellipse cx="60" cy="48" rx="3" ry="4" fill="white" />
      <circle cx="59.5" cy="48.5" r="1.5" fill="#333" />
      
      {/* Eyebrows */}
      <path d="M35 42 Q40 40 45 42" stroke="#333" strokeWidth="1" fill="none" />
      <path d="M55 42 Q60 40 65 42" stroke="#333" strokeWidth="1" fill="none" />
      
      {/* Nose */}
      <path d="M48 52 Q50 56 52 52" stroke="#333" strokeWidth="0.5" fill="none" opacity="0.3" />
      
      {/* Mouth */}
      <path d="M43 64 Q50 68 57 64" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      
      {/* Cheeks */}
      <circle cx="35" cy="58" r="4" fill="#f00" opacity="0.1" />
      <circle cx="65" cy="58" r="4" fill="#f00" opacity="0.1" />
    </svg>
  );
};
