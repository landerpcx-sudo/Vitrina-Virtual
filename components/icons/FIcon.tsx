import React from 'react';

export const FIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path d="M10.15 4.49a.75.75 0 00-1.5 0v15a.75.75 0 001.5 0v-6.08h6.81a.75.75 0 000-1.5H10.15V4.49z" />
        <path d="M18.46 4.49a.75.75 0 00-1.5 0v3.08h-6.81a.75.75 0 000 1.5h8.31a.75.75 0 00.75-.75V4.49z" />
    </svg>
);