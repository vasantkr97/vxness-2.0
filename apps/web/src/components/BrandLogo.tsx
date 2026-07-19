import '../styles/public-pages.css';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 24,
  md: 30,
  lg: 40,
};

export const BrandLogo = ({ size = 'md', showWordmark = true, className = '' }: BrandLogoProps) => {
  const markSize = sizeMap[size];

  return (
    <span className={`vx-brand vx-brand--${size} ${className}`.trim()}>
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="vx-brand__mark"
      >
        <rect x="0.75" y="0.75" width="34.5" height="34.5" rx="8.25" fill="#111318" stroke="#343840" strokeWidth="1.5" />
        <path d="M7.5 9.5L15.8 26.5L22.8 9.5" stroke="#F4F5F7" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 15L29 24M29 15L22 24" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {showWordmark && <span className="vx-brand__word">vxness</span>}
    </span>
  );
};
