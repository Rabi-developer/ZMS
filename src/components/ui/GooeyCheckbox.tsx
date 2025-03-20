// import React from 'react';

// const GooeyCheckbox = ({
//   id,
//   checkedColor = '#866efb',
//   size = '24px',
//   filterBlur = '4',
//   borderColor = '#bfbfc0',
//   animationDuration = '0.6s',
//   animationDelay = '0.2s',
// }) => {
//   return (
//     <div className="checkbox-wrapper" style={{ position: 'relative' }}>
//       <div className="cbx" style={{ width: size, height: size }}>
//         <input
//           id={id}
//           type="checkbox"
//           style={{ width: size, height: size }}
//         />
//         <label htmlFor={id}></label>
//         <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
//           <path d="M2 8.36364L6.23077 12L13 2"></path>
//         </svg>
//       </div>

//       <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
//         <defs>
//           <filter id={`goo-${id}`}>
//             <feGaussianBlur in="SourceGraphic" stdDeviation={filterBlur} result="blur"></feGaussianBlur>
//             <feColorMatrix
//               in="blur"
//               mode="matrix"
//               values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7"
//               result={`goo-${id}`}
//             ></feColorMatrix>
//             <feBlend in="SourceGraphic" in2={`goo-${id}`}></feBlend>
//           </filter>
//         </defs>
//       </svg>

//       <style>
//         {`
//           .checkbox-wrapper {
//             position: relative;
//           }
//           .checkbox-wrapper > svg {
//             position: absolute;
//             top: -130%;
//             left: -170%;
//             width: 110px;
//             pointer-events: none;
//           }
//           .checkbox-wrapper * {
//             box-sizing: border-box;
//           }
//           .checkbox-wrapper input[type="checkbox"] {
//             -webkit-appearance: none;
//             -moz-appearance: none;
//             appearance: none;
//             -webkit-tap-highlight-color: transparent;
//             cursor: pointer;
//             margin: 0;
//           }
//           .checkbox-wrapper input[type="checkbox"]:focus {
//             outline: 0;
//           }
//           .checkbox-wrapper .cbx {
//             position: relative;
//             width: ${size};
//             height: ${size};
//             top: calc(50vh - 12px);
//             left: calc(50vw - 12px);
//           }
//           .checkbox-wrapper .cbx input {
//             position: absolute;
//             top: 0;
//             left: 0;
//             width: ${size};
//             height: ${size};
//             border: 2px solid ${borderColor};
//             border-radius: 50%;
//           }
//           .checkbox-wrapper .cbx label {
//             width: ${size};
//             height: ${size};
//             background: none;
//             border-radius: 50%;
//             position: absolute;
//             top: 0;
//             left: 0;
//             -webkit-filter: url("#goo-${id}");
//             filter: url("#goo-${id}");
//             pointer-events: none;
//           }
//           .checkbox-wrapper .cbx svg {
//             position: absolute;
//             top: 5px;
//             left: 4px;
//             z-index: 1;
//             pointer-events: none;
//           }
//           .checkbox-wrapper .cbx svg path {
//             stroke: #fff;
//             stroke-width: 3;
//             stroke-linecap: round;
//             stroke-linejoin: round;
//             stroke-dasharray: 19;
//             stroke-dashoffset: 19;
//             transition: stroke-dashoffset ${animationDuration} ease;
//             transition-delay: ${animationDelay};
//           }
//           .checkbox-wrapper .cbx input:checked + label {
//             animation: splash-${id} ${animationDuration} ease forwards;
//           }
//           .checkbox-wrapper .cbx input:checked + label + svg path {
//             stroke-dashoffset: 0;
//           }
//           @keyframes splash-${id} {
//             40% {
//               background: ${checkedColor};
//               box-shadow: 0 -18px 0 -8px ${checkedColor}, 16px -8px 0 -8px ${checkedColor}, 16px 8px 0 -8px ${checkedColor}, 0 18px 0 -8px ${checkedColor}, -16px 8px 0 -8px ${checkedColor}, -16px -8px 0 -8px ${checkedColor};
//             }
//             100% {
//               background: ${checkedColor};
//               box-shadow: 0 -36px 0 -10px transparent, 32px -16px 0 -10px transparent, 32px 16px 0 -10px transparent, 0 36px 0 -10px transparent, -32px 16px 0 -10px transparent, -32px -16px 0 -10px transparent;
//             }
//           }
//         `}
//       </style>
//     </div>
//   );
// };

// export default GooeyCheckbox;
