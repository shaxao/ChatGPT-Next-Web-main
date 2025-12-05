import React from "react";
import styles from "./loader.module.scss";

export default function Loader() {
  return (
    <div className={styles.loader}>
      <div className={styles.canvas}>
        <svg
          className={styles.svg}
          viewBox="0 0 400 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="goo">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="6"
                result="blur"
              />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8a2be2" />
              <stop offset="50%" stopColor="#00c2ff" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <g filter="url(#goo)">
            <circle
              className={styles.dot}
              cx="60"
              cy="100"
              r="12"
              fill="url(#grad)"
            />
            <circle
              className={styles.dot}
              cx="120"
              cy="100"
              r="12"
              fill="url(#grad)"
            />
            <circle
              className={styles.dot}
              cx="180"
              cy="100"
              r="12"
              fill="url(#grad)"
            />
            <circle
              className={styles.dot}
              cx="240"
              cy="100"
              r="12"
              fill="url(#grad)"
            />
            <circle
              className={styles.dot}
              cx="300"
              cy="100"
              r="12"
              fill="url(#grad)"
            />
          </g>
          <text x="200" y="160" textAnchor="middle" className={styles.brand}>
            ChatGPT Next Web
          </text>
        </svg>
      </div>
      <div className={styles.progress}>
        <div className={styles.bar} />
      </div>
    </div>
  );
}
