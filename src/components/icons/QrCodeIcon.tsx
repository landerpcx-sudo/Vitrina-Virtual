import React from 'react';

export const QrCodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="3" width="6" height="6" />
    <rect x="15" y="3" width="6" height="6" />
    <rect x="3" y="15" width="6" height="6" />
    <line x1="15" y1="15" x2="15" y2="15.01" />
    <line x1="18" y1="15" x2="18" y2="15.01" />
    <line x1="21" y1="15" x2="21" y2="21" />
    <line x1="15" y1="18" x2="18" y2="18" />
    <line x1="15" y1="21" x2="15" y2="21.01" />
    <line x1="18" y1="21" x2="18" y2="21.01" />
  </svg>
);
