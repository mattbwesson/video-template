import React from 'react';
import { SymbolSvg, registerSymbolJsx } from './symbolRegistry';
import { staticFile } from 'remotion';
import './WorkvivoMobileStyles.css';
import './WorkvivoGlassEdge.css';
import {
  companyInitialOf,
  useCustomization,
} from '../../customize/CustomizationProvider';

export const WorkvivoMobileSvgDefs: React.FC = () => (
  <svg
    className="wm-sprite"
    xmlns="http://www.w3.org/2000/svg"
    width="0"
    height="0"
    style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    aria-hidden="true"
  >
    <defs>
      <symbol id="i-battery" viewBox="0 0 25 12" fill="none">
        <path opacity="0.35" d="M2.66699 0.5H19.333C20.5296 0.5 21.5 1.47038 21.5 2.66699V8.66699C21.4998 9.86346 20.5295 10.833 19.333 10.833H2.66699C1.47048 10.833 0.500176 9.86346 0.5 8.66699V2.66699L0.510742 2.44531C0.621596 1.35265 1.54509 0.5 2.66699 0.5Z" stroke="white"/>
        <path opacity="0.4" d="M23 3.66669V7.66669C23.8047 7.32791 24.328 6.53982 24.328 5.66669C24.328 4.79355 23.8047 4.00546 23 3.66669Z" fill="white"/>
        <path d="M2 3.33333C2 2.59695 2.59695 2 3.33333 2H18.6667C19.403 2 20 2.59695 20 3.33333V8C20 8.73638 19.403 9.33333 18.6667 9.33333H3.33333C2.59695 9.33333 2 8.73638 2 8V3.33333Z" fill="white"/>
      </symbol>
      <symbol id="i-signal" viewBox="0 0 17 11" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M16 0H15C14.4477 0 14 0.447715 14 1V9.66667C14 10.219 14.4477 10.6667 15 10.6667H16C16.5523 10.6667 17 10.219 17 9.66667V1C17 0.447715 16.5523 0 16 0ZM10.3333 2.33333H11.3333C11.8856 2.33333 12.3333 2.78105 12.3333 3.33333V9.66667C12.3333 10.219 11.8856 10.6667 11.3333 10.6667H10.3333C9.78106 10.6667 9.33334 10.219 9.33334 9.66667V3.33333C9.33334 2.78105 9.78106 2.33333 10.3333 2.33333ZM6.66666 4.66667H5.66666C5.11437 4.66667 4.66666 5.11438 4.66666 5.66667V9.66667C4.66666 10.219 5.11437 10.6667 5.66666 10.6667H6.66666C7.21894 10.6667 7.66666 10.219 7.66666 9.66667V5.66667C7.66666 5.11438 7.21894 4.66667 6.66666 4.66667ZM2 6.66667H1C0.447715 6.66667 0 7.11438 0 7.66667V9.66667C0 10.219 0.447715 10.6667 1 10.6667H2C2.55228 10.6667 3 10.219 3 9.66667V7.66667C3 7.11438 2.55228 6.66667 2 6.66667Z" fill="white"/>
      </symbol>
      <symbol id="i-ui-connect" viewBox="0 0 12.0382 14.7717" fill="none">
        <path d="M7.7678 8.87607C9.29051 8.20384 10.3532 6.68063 10.3532 4.90917C10.3532 2.51547 8.41278 0.575 6.01908 0.575C3.62539 0.575 1.68492 2.51547 1.68492 4.90917C1.68492 6.68063 2.74765 8.20384 4.27037 8.87607C2.4864 9.4063 1.10128 10.7256 0.625259 12.3748C0.411356 13.1158 0.933707 13.798 1.69557 13.9184C2.57556 14.0576 3.968 14.1967 6.01908 14.1967C8.0702 14.1967 9.46261 14.0576 10.3426 13.9184C11.1045 13.798 11.6268 13.1158 11.4129 12.3748C10.9369 10.7256 9.55177 9.4063 7.7678 8.87607Z" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round"/>
      </symbol>
      <symbol id="i-ui-employee-standalone" viewBox="0 0 24 24" stroke="currentColor">
        <g transform="scale(1.71429)">
          <circle cx="5.92" cy="5.92" r="5.42" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 1, strokeLinecap: 'round', strokeLinejoin: 'round' }}/>
          <path d="M13.5 13.5 9.75 9.75" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 1, strokeLinecap: 'round', strokeLinejoin: 'round' }}/>
        </g>
      </symbol>
      <symbol id="i-ui-everyone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </symbol>
      <symbol id="i-ui-favorite-star" viewBox="0 0 35 34" fill="none">
        <path d="M18.4841 2.12657L22.3806 9.99303C22.4692 10.1927 22.6086 10.3656 22.7849 10.4946C22.9612 10.6236 23.1682 10.7042 23.3853 10.7282L31.987 12.0025C32.236 12.0345 32.4708 12.1368 32.664 12.2972C32.8571 12.4577 33.0006 12.6698 33.0777 12.9088C33.1548 13.1478 33.1623 13.4038 33.0993 13.6468C33.0364 13.8899 32.9056 14.1101 32.7222 14.2816L26.5221 20.4326C26.3639 20.5805 26.2451 20.7655 26.1766 20.971C26.1082 21.1764 26.0921 21.3957 26.13 21.6089L27.6249 30.2596C27.6682 30.5081 27.6408 30.7639 27.5459 30.9977C27.451 31.2314 27.2924 31.4339 27.0882 31.582C26.8839 31.7301 26.6422 31.8179 26.3904 31.8354C26.1387 31.8529 25.8872 31.7994 25.6644 31.6809L17.9205 27.5884C17.7222 27.4911 17.5042 27.4404 17.2833 27.4404C17.0624 27.4404 16.8445 27.4911 16.6462 27.5884L8.90223 31.6809C8.67944 31.7994 8.42789 31.8529 8.17618 31.8354C7.92448 31.8179 7.68274 31.7301 7.47847 31.582C7.27419 31.4339 7.11559 31.2314 7.02071 30.9977C6.92582 30.7639 6.89846 30.5081 6.94175 30.2596L8.43662 21.5109C8.4745 21.2977 8.45848 21.0784 8.39 20.8729C8.32152 20.6675 8.20276 20.4824 8.04452 20.3346L1.77096 14.2816C1.58536 14.1054 1.45483 13.8791 1.3952 13.6303C1.33556 13.3814 1.34937 13.1205 1.43495 12.8794C1.52054 12.6382 1.67422 12.427 1.87739 12.2713C2.08057 12.1157 2.32451 12.0223 2.57966 12.0025L11.1813 10.7282C11.3984 10.7042 11.6054 10.6236 11.7817 10.4946C11.958 10.3656 12.0974 10.1927 12.1861 9.99303L16.0825 2.12657C16.1886 1.89746 16.3581 1.70349 16.5708 1.56755C16.7836 1.43161 17.0308 1.35938 17.2833 1.35938C17.5358 1.35938 17.783 1.43161 17.9958 1.56755C18.2086 1.70349 18.378 1.89746 18.4841 2.12657V2.12657Z" stroke="#FACC15" strokeWidth="2.71743" strokeLinecap="round" strokeLinejoin="round"/>
      </symbol>
      <symbol id="i-ui-human-resources" viewBox="0 0 47 50" fill="none">
        <path d="M37.3406 14.7037C37.4644 6.82362 31.3679 0.338172 23.7237 0.218088C16.0795 0.098004 9.78237 6.38876 9.65858 14.2689C9.53479 22.149 15.6313 28.6345 23.2754 28.7545C30.9196 28.8746 37.2168 22.5839 37.3406 14.7037Z" fill="white"/>
        <path d="M45.3814 41.5598C42.472 35.0304 36.3396 31.1684 29.4811 29.936C29.4041 29.9214 29.3243 29.9324 29.2537 29.9663C27.4529 30.8144 25.5338 31.2399 23.4982 31.2408C21.4617 31.2408 19.5426 30.8163 17.7409 29.9663C17.6703 29.9333 17.5914 29.9232 17.5153 29.9379C10.6568 31.173 4.52628 35.0359 1.61782 41.5653C0.491845 44.0914 -0.0463852 46.8 0.00312839 49.6919C0.00679606 49.8405 0.126912 49.9597 0.274536 49.9606C0.935633 49.9679 8.67717 49.9707 23.4991 49.9689C38.322 49.9679 46.0645 49.9634 46.7256 49.956C46.8741 49.956 46.9951 49.835 46.997 49.6855C47.0456 46.7945 46.5074 44.0859 45.3805 41.5607L45.3814 41.5598Z" fill="white"/>
      </symbol>
      <symbol id="i-ui-it-support-and-resources" viewBox="0 0 54 52" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M31.9357 0C40.6472 1.79632 47.8002 7.85934 51.1108 15.9099H41.0368C40.2815 12.4344 39.1473 9.30428 37.7275 6.69167C36.1271 3.74442 34.1551 1.43897 31.9357 0.00119515V0ZM38.735 15.9099H27.6738V0.670482C30.774 1.1844 33.6042 3.7982 35.7566 7.76373C37.0128 10.0775 38.0298 12.8384 38.735 15.9099ZM25.4221 15.9099H14.361C15.0661 12.8384 16.0832 10.0775 17.3393 7.76373C19.4918 3.7994 22.3219 1.1844 25.4221 0.670482V15.9099ZM12.0603 15.9099H1.98635C5.29693 7.85934 12.4499 1.79632 21.1614 0C18.942 1.43777 16.97 3.74323 15.3697 6.69048C13.951 9.30428 12.8168 12.4344 12.0603 15.9087V15.9099ZM51.9199 18.1616C52.6848 20.6391 53.0972 23.2721 53.0972 26.0006C53.0972 28.7291 52.6848 31.3621 51.9199 33.8396H41.4647C41.8711 31.3537 42.091 28.7232 42.091 26.0006C42.091 23.278 41.8723 20.6475 41.4647 18.1616H51.9199ZM39.1856 33.8384H27.6738V18.1616H39.1856C39.6098 20.6308 39.8381 23.2637 39.8381 26.0006C39.8381 28.7375 39.6086 31.3704 39.1856 33.8396V33.8384ZM25.4221 33.8384H13.9104C13.4861 31.3692 13.2579 28.7363 13.2579 25.9994C13.2579 23.2625 13.4873 20.6296 13.9104 18.1604H25.4221V33.8372V33.8384ZM11.6324 33.8384H1.17723C0.412329 31.3609 0 28.7279 0 25.9994C0 23.2709 0.412329 20.6379 1.17723 18.1604H11.6324C11.2249 20.6463 11.0062 23.2768 11.0062 25.9994C11.0062 28.722 11.2249 31.3525 11.6324 33.8384ZM51.1096 36.0901C47.799 44.1407 40.6472 50.2037 31.9345 52C34.1539 50.5622 36.126 48.2568 37.7263 45.3095C39.1449 42.6957 40.2791 39.5656 41.0357 36.0913H51.1096V36.0901ZM27.6738 51.3295V36.0901H38.735C38.0298 39.1616 37.0128 41.9225 35.7566 44.2363C33.6042 48.2006 30.774 50.8156 27.6738 51.3295ZM21.1614 52C12.4499 50.2037 5.29693 44.1407 1.98635 36.0901H12.0603C12.8156 39.5656 13.9499 42.6957 15.3697 45.3083C16.97 48.2556 18.942 50.561 21.1614 51.9988V52ZM14.361 36.0901H25.4221V51.3295C22.3219 50.8156 19.4918 48.2018 17.3393 44.2363C16.0832 41.9225 15.0661 39.1616 14.361 36.0901Z" fill="white"/>
      </symbol>
      <symbol id="i-ui-learning-hub" viewBox="0 0 65 68" fill="none">
        <path d="M32.1265 61.2324V65.3915" stroke="white" strokeWidth="3.26953" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M40.4331 47.8594V55.3861C40.4331 59.3394 37.1064 60.9307 32.1163 60.9307C27.1262 60.9307 23.7994 59.3394 23.7994 55.3861V47.8594H40.4331Z" stroke="white" strokeWidth="3.26964" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23.8127 54.3633H40.4464" stroke="white" strokeWidth="3.26953" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M32.1265 1.63477V7.17916" stroke="white" strokeWidth="3.26953" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1.63477 29.3574H7.98607" stroke="white" strokeWidth="3.26953" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.56335 8.56445L14.1077 14.1088" stroke="white" strokeWidth="3.26953" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M62.6233 29.3574H56.272" stroke="white" strokeWidth="3.26953" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M55.6916 8.56445L50.1472 14.1088" stroke="white" strokeWidth="3.26953" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M32.1278 14.1094C36.8804 14.1941 41.4142 16.1204 44.7753 19.4814C48.1364 22.8425 50.0627 27.3764 50.1474 32.1289C50.2093 35.6999 49.1812 39.205 47.2001 42.1768C45.219 45.1484 42.3786 47.4454 39.0585 48.7617H25.1972C21.8771 47.4454 19.0367 45.1484 17.0556 42.1768C15.0745 39.205 14.0463 35.6999 14.1083 32.1289C14.193 27.3764 16.1193 22.8425 19.4804 19.4814C22.8415 16.1204 27.3753 14.1941 32.1278 14.1094ZM31.1181 20.4121C30.2152 20.4121 29.4833 21.144 29.4833 22.0469C29.4835 22.9496 30.2153 23.6816 31.1181 23.6816C36.6871 23.6819 41.202 28.1966 41.202 33.7656C41.2022 34.6683 41.934 35.4004 42.8368 35.4004C43.7394 35.4002 44.4714 34.6682 44.4716 33.7656C44.4716 26.3908 38.4928 20.4123 31.1181 20.4121Z" fill="white" stroke="white" strokeWidth="3.26953" strokeLinecap="round" strokeLinejoin="round"/>
      </symbol>
      <symbol id="i-ui-pages-older-capture" viewBox="0 0 24 24" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M6.67066 16.2484V4.21114C6.67066 3.03796 7.6217 2.08691 8.79488 2.08691H14.2877C14.851 2.08691 15.3914 2.31072 15.7897 2.70908L19.502 6.42126C19.9003 6.81964 20.1241 7.35994 20.1241 7.92332V16.2484C20.1241 17.4215 19.173 18.3726 17.9999 18.3726H8.79488C7.6217 18.3726 6.67066 17.4215 6.67066 16.2484ZM5.25459 7.39747C5.25459 6.81089 4.77907 6.33536 4.19248 6.33536C3.6059 6.33536 3.13037 6.81089 3.13037 7.39747V18.7267C3.13037 20.4864 4.55694 21.913 6.31671 21.913H15.5217C16.1083 21.913 16.5838 21.4375 16.5838 20.8509C16.5838 20.2643 16.1083 19.7888 15.5217 19.7888H6.31671C5.73012 19.7888 5.25459 19.3132 5.25459 18.7267V7.39747Z" fill="currentColor"/>
      </symbol>
      <symbol id="i-vendor-servicenow" viewBox="0 0 512 512">
        <defs>
          <style>{`
            .wm-servicenow-cls-1 { fill: #61d64e; }
            .wm-servicenow-cls-2 { fill: #032d42; }
          `}</style>
        </defs>
        <g>
          <g>
            <path className="wm-servicenow-cls-2" d="M511,0l-.08,510.92-510.92.08V0h511ZM335.07,412.39c5.64,4,11.47,5.55,17.79,7.53,2.77.87,3.62.52,6.32.21,9.9-1.16,17.37-4.87,24.38-11.71,27.74-27.06,46.21-61.32,52.77-99.79,9.18-53.88-5.58-108.93-39.72-150.78-58.17-71.3-159.91-87.55-237.6-38.3-49.68,31.49-82.6,84.79-86.59,144.17-3.58,53.27,16.77,104.05,53.72,142.1,13.05,13.44,33.47,18.8,49.63,7.28,25.17-17.93,47.42-25.34,78.49-25.97,28.79-.58,56.96,8.32,80.82,25.25Z"/>
            <polygon className="wm-servicenow-cls-1" points="511 0 512 0 512 512 0 512 0 511 510.92 510.92 511 0"/>
            <g>
              <path className="wm-servicenow-cls-1" d="M335.07,412.39c-23.86-16.93-52.03-25.84-80.82-25.25-31.07.63-53.32,8.04-78.49,25.97-16.16,11.51-36.58,6.16-49.63-7.28-36.95-38.06-57.3-88.84-53.72-142.1,3.99-59.38,36.92-112.68,86.59-144.17,77.7-49.25,179.44-33,237.6,38.3,34.14,41.84,48.9,96.9,39.72,150.78-6.55,38.47-25.03,72.73-52.77,99.79-7.02,6.84-14.48,10.56-24.38,11.71-2.69.32-3.55.66-6.32-.21-6.32-1.98-12.15-3.53-17.79-7.53ZM347.35,274.06c0-51.13-41.45-92.58-92.58-92.58s-92.58,41.45-92.58,92.58,41.45,92.58,92.58,92.58,92.58-41.45,92.58-92.58Z"/>
              <circle className="wm-servicenow-cls-2" cx="254.76" cy="274.06" r="92.58"/>
            </g>
          </g>
        </g>
      </symbol>
      <symbol id="i-vendor-workday" viewBox="0 0 3200 3200">
        <defs>
          <style>{`
            .wm-workday-cls-1 { fill: #fbfdfd; }
            .wm-workday-cls-2 { fill: #005cb8; }
            .wm-workday-cls-3 { fill: #ef8a03; }
          `}</style>
        </defs>
        <path className="wm-workday-cls-2" d="M2576,0c.3,1.31,1.53,2.17,4.04,2.2l19.59.2,22.66,1.4c136.97,13.93,263.89,82.84,362.61,177.35,109.82,105.13,194.87,250.24,213.43,402.64.63,5.16-2.65,11.05,1.66,14.21v2012c-4.31,3.9-1.04,10.24-1.48,14.98-28.37,305.94-275.26,549.35-581.58,573.35-3.45.27-8.35-2.15-10.93,1.67H600c-1.89-3.69-6.24-1.39-10.12-1.75-136.67-12.56-261.41-76.38-361.45-168.75-116.1-107.19-206.79-258.71-224.31-417.31-.98-8.89.18-17.27-4.12-24.19V624c6.22-10.59,2.73-20.48,3.49-32.44C22.98,282.85,271.2,29.65,579.57,3.45c9.33-.79,15.27.7,24.75-1.47,5.9-1.35,14.81,2.71,19.78-1.98h1951.9ZM1744.79,771.23c124.36,29.48,235.37,96.69,318.66,193.3,42.44,49.23,76.87,103.81,102.21,163.56l29.28,82.73c14.24,46.09,53.96,78.01,103.09,77.43,64.32-2.35,111.9-58.44,104.28-122.41-34.97-140.65-105.63-269.61-206.08-373.69-184.31-190.97-451.52-282.95-714.77-246.41-272.49,37.82-515.64,216.48-631.81,465.61-21.16,45.38-38.89,90.41-51.22,138.7-9.53,37.32-.37,76.3,25.27,104.09s60.77,36.09,96.08,29.87c48.14-8.47,73.02-43.94,86.97-89.54,44.15-144.27,138.13-268.96,266.05-349.61,142.69-89.96,308.36-112.41,471.96-73.64ZM2349.95,1582.09l-133.9.32c-29.94.07-42.54,13.96-49.54,42.75l-143.79,591.44-47.65,184.88c-9.01-9.51-11.54-18.81-14.74-30.34l-202.97-751.76c-6.36-23.54-28.33-37.67-51.39-37.67h-213.91c-24.23.01-45.77,14.4-52.27,38.49l-67.97,251.59-143.17,525.06c-9.74-4.98-10.13-13.67-12.57-23.49l-187.18-755.2c-5.47-22.05-21.27-35.61-43.26-35.59l-147.24.12c-14.03.01-28.81,5.77-36.53,17.17s-9.16,26.19-5.38,40.31l265.31,991.22c6.19,23.14,25.91,37.6,49.2,37.57l210.76-.27c23.59-.03,43.22-13.74,49.18-35.64l17.25-63.27,213.72-768.35,11.74,35.44,211.72,792.99c7.38,27.63,22.62,38.24,50.78,38.29l211.65.34c28.01.05,41.3-13.85,48.51-40.74l262.66-980.04c3.15-11.76,3.66-22.14,2.22-33.21-3.02-23.28-27.25-32.46-51.26-32.4Z"/>
        <g>
          <path className="wm-workday-cls-1" d="M2349.95,1582.09c24.01-.06,48.24,9.12,51.26,32.4,1.43,11.07.93,21.45-2.22,33.21l-262.66,980.04c-7.21,26.9-20.5,40.79-48.51,40.74l-211.65-.34c-28.17-.05-43.41-10.65-50.78-38.29l-211.72-792.99-11.74-35.44-213.72,768.35-17.25,63.27c-5.97,21.9-25.59,35.61-49.18,35.64l-210.76.27c-23.29.03-43.01-14.43-49.2-37.57l-265.31-991.22c-3.78-14.12-2-29.4,5.38-40.31s22.5-17.16,36.53-17.17l147.24-.12c21.98-.02,37.79,13.54,43.26,35.59l187.18,755.2c2.43,9.82,2.83,18.51,12.57,23.49l143.17-525.06,67.97-251.59c6.51-24.09,28.04-38.48,52.27-38.48h213.91c23.06-.01,45.04,14.12,51.39,37.66l202.97,751.76c3.2,11.53,5.73,20.83,14.74,30.34l47.65-184.88,143.79-591.44c7-28.79,19.6-42.68,49.54-42.75l133.9-.32Z"/>
          <path className="wm-workday-cls-3" d="M1744.79,771.23c-163.6-38.78-329.27-16.33-471.96,73.64-127.93,80.66-221.9,205.34-266.05,349.61-13.95,45.6-38.83,81.06-86.97,89.54-35.32,6.22-71.33-3.03-96.08-29.87s-34.8-66.77-25.27-104.09c12.33-48.29,30.06-93.32,51.22-138.7,116.17-249.13,359.33-427.79,631.81-465.61,263.24-36.54,530.46,55.45,714.77,246.41,100.45,104.08,171.11,233.04,206.08,373.69,7.61,63.98-39.96,120.06-104.28,122.41-49.13.58-88.85-31.34-103.09-77.43l-29.28-82.73c-25.35-59.75-59.78-114.33-102.21-163.56-83.29-96.62-194.31-163.83-318.66-193.3Z"/>
        </g>
      </symbol>
      <symbol id="i-wifi" viewBox="0 0 16 11" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M7.63661 2.27733C9.8525 2.27742 11.9837 3.12886 13.5896 4.65566C13.7105 4.77354 13.9038 4.77205 14.0229 4.65233L15.1789 3.48566C15.2392 3.42494 15.2729 3.34269 15.2724 3.25711C15.2719 3.17153 15.2373 3.08967 15.1763 3.02966C10.9612 -1.00989 4.31137 -1.00989 0.0962725 3.02966C0.0352139 3.08963 0.00057 3.17146 6.97078e-06 3.25704C-0.000556058 3.34262 0.0330082 3.42489 0.0932725 3.48566L1.24961 4.65233C1.36863 4.77223 1.56208 4.77372 1.68294 4.65566C3.28909 3.12876 5.4205 2.27732 7.63661 2.27733ZM7.63659 6.07299C8.85408 6.07292 10.0281 6.52545 10.9306 7.34266C11.0527 7.45864 11.2449 7.45613 11.3639 7.33699L12.5186 6.17033C12.5794 6.10913 12.6131 6.02612 12.6123 5.93985C12.6114 5.85359 12.576 5.77127 12.5139 5.71133C9.76573 3.15494 5.50979 3.15494 2.76159 5.71133C2.69952 5.77127 2.6641 5.85363 2.66328 5.93992C2.66247 6.02621 2.69633 6.10922 2.75726 6.17033L3.91159 7.33699C4.03058 7.45613 4.22286 7.45864 4.34493 7.34266C5.2468 6.52599 6.41991 6.0735 7.63659 6.07299ZM9.94959 8.62681C9.95136 8.71332 9.91735 8.79672 9.8556 8.85733L7.85826 10.873C7.79971 10.9322 7.71989 10.9656 7.6366 10.9656C7.55331 10.9656 7.47348 10.9322 7.41493 10.873L5.41726 8.85733C5.35555 8.79668 5.3216 8.71325 5.32343 8.62674C5.32526 8.54023 5.36271 8.45831 5.42693 8.40033C6.7025 7.32144 8.57069 7.32144 9.84626 8.40033C9.91044 8.45836 9.94783 8.5403 9.94959 8.62681Z" fill="white"/>
      </symbol>
    </defs>
  </svg>
);

export interface WorkvivoMobileHomeProps {
  scrollTop?: number;
}

/**
 * Break a headline into two roughly equal lines.
 *
 * The reference had a hand-placed `<br/>` in the lead card; a rewritten headline has no
 * idea where that was, and letting it wrap naturally gives a long orphan on line two.
 * Splitting at the word boundary nearest the middle keeps the block looking deliberate
 * whatever the copy says.
 */
const splitForTwoLines = (title: string): string => {
  const words = title.split(/\s+/);
  if (words.length < 3) return title;
  const mid = Math.round(title.length / 2);
  let best = 1;
  let bestDelta = Infinity;
  for (let i = 1; i < words.length; i++) {
    const delta = Math.abs(words.slice(0, i).join(" ").length - mid);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = i;
    }
  }
  return `${words.slice(0, best).join(" ")}\n${words.slice(best).join(" ")}`;
};

export const WorkvivoMobileHome: React.FC<WorkvivoMobileHomeProps> = ({
  scrollTop = 0,
}) => {
  const { person, image, copy, header, logo } = useCustomization();
  const companyInitial = companyInitialOf(copy.companyName);
  const hdr = header('mobile.hero');
  const mnews = copy.feed.mobileNews;
  return (
    <div className="wm-phone wv-glass-phone">
      <GlassRing />
      <WorkvivoMobileSvgDefs />
      <div className="wm-screen">
        {/* Status bar */}
        

        {/* Scrollable body */}
        <div className="wm-scroll">
          <div
            className="wm-scroll-track"
            style={{
              transform: `translateY(-${scrollTop}px)`,
            }}
          >
            {/* Segmented tabs */}
            <div className="wm-seg">
              <a href="#" className="wm-on">My Work</a>
              <a href="#">My Company</a>
              <a href="#">Resources</a>
            </div>

            {/* Quick Links */}
            <div className="wm-sec">
              <div className="wm-shead"><h2>Quick Links</h2><a href="#">View All</a></div>
              {/* Same three `app.quicklink` slots the desktop homepage and the Spotlight
                  tab draw — one swap, three screens. */}
              <div className="wm-qrow">
                <div className="wm-qtile">
                  <SlotIcon slot="app.quicklink.0" size={56}>
                    <SymbolSvg width="56" height="56" href="#i-vendor-workday" />
                  </SlotIcon>
                  <span>{copy.spotlight.apps[0]}</span>
                </div>
                <div className="wm-qtile">
                  <SlotIcon slot="app.quicklink.1" size={56}>
                    <SymbolSvg className="wm-logo" width="56" height="56" href="#i-vendor-servicenow" />
                  </SlotIcon>
                  <span>{copy.spotlight.apps[1]}</span>
                </div>
                <div className="wm-qtile">
                  <SlotIcon slot="app.quicklink.2" size={56}>
                    {/* The real mark, as at 1664 on the Spotlight tab — this tile used to
                        draw the word "zoom" on a blue square as a stand-in. */}
                    <img className="wm-zoomph" src={staticFile("img/zoomicon.png")} width={56} height={56} alt="" />
                  </SlotIcon>
                  <span>{copy.spotlight.apps[2]}</span>
                </div>
              </div>
            </div>

            {/* Shortcut Grid */}
            <div className="wm-sec">
              <div className="wm-grid2">
                <div className="wm-srow"><div className="wm-rsq"><SymbolSvg className="wm-white" width="22" height="22" href="#i-ui-human-resources" /></div><span>Payroll</span></div>
                <div className="wm-srow"><div className="wm-rsq"><SymbolSvg className="wm-white" width="22" height="22" href="#i-ui-favorite-star" /></div><span>Benefits Hub</span></div>
                <div className="wm-srow"><div className="wm-rsq"><SymbolSvg className="wm-white" width="22" height="22" href="#i-ui-it-support-and-resources" /></div><span>IT Support</span></div>
                <div className="wm-srow"><div className="wm-rsq"><SymbolSvg width="21" height="21" style={{ color: '#fff' }} href="#i-ui-pages-older-capture" /></div><span>Learning Centre</span></div>
              </div>
            </div>

            {/* Documents */}
            <div className="wm-sec">
              <div className="wm-shead"><h2>Documents</h2><a href="#">View All</a></div>
              <div className="wm-card wm-doclist">
                <div className="wm-doc"><div className="wm-rsq"><SymbolSvg width="21" height="21" style={{ color: '#fff' }} href="#i-ui-pages-older-capture" /></div><span>Safety Procedures</span></div>
                <div className="wm-doc"><div className="wm-rsq"><SymbolSvg width="20" height="20" style={{ color: '#fff' }} href="#i-ui-connect" /></div><span>Employee Handbook</span></div>
                <div className="wm-doc"><div className="wm-rsq"><SymbolSvg className="wm-white" width="22" height="22" href="#i-ui-learning-hub" /></div><span>Learning Resources</span></div>
              </div>
            </div>

            {/* Featured News */}
            <div className="wm-sec">
              <div className="wm-shead"><h2>Featured News</h2><a href="#">View All</a></div>
              <div data-vc-slot="mobile.lead.0" className="wm-bignews">
                <img
                  src={image("mobile.lead.0", staticFile("fillers/spotify.Bloomberg.11.27.17.jpg"))}
                  style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                  alt=""
                />
                {/* The dot texture is a radial gradient, which the export drops whatever
                    element carries it — kept for the Player. The scrim below is linear and
                    does render, and both must sit over the photo and under the text. */}
                <div className="wm-bignews-dots" />
                <div className="wm-bignews-scrim" />
                <div className="wm-bntx">
                  <h3 style={{ whiteSpace: "pre-line" }}>{splitForTwoLines(mnews[0].title)}</h3>
                  <div className="wm-meta wm-light"><SymbolSvg width="16" height="16" href="#i-ui-everyone" /><span>Global</span></div>
                  <div className="wm-pub">Published 2 days ago</div>
                </div>
              </div>
              <div className="wm-ngrid">
                <div className="wm-ncard">
                  <img data-vc-slot="mobile.news.0"
                    className="wm-nthumb"
                    src={image("mobile.news.0", staticFile("fillers/images (1).jpeg"))}
                    alt=""
                    style={{ objectFit: 'cover' }}
                  />
                  <h4>{mnews[1].title}</h4>
                  <div className="wm-meta"><SymbolSvg width="16" height="16" href="#i-ui-everyone" /><span>Global</span></div>
                  <div className="wm-pub">Published 1 day ago</div>
                </div>
                <div className="wm-ncard">
                  <img data-vc-slot="mobile.news.1"
                    className="wm-nthumb"
                    src={image("mobile.news.1", staticFile("fillers/images (2).jpeg"))}
                    alt=""
                    style={{ objectFit: 'cover' }}
                  />
                  <h4>{mnews[2].title}</h4>
                  <div className="wm-meta"><SymbolSvg width="16" height="16" href="#i-ui-everyone" /><span>Global</span></div>
                  <div className="wm-pub">Published 2 days ago</div>
                </div>
              </div>
            </div>

            <div className="wm-pad"></div>
          </div>
        </div>

        {/* Hero header.
            A cover photo under a brand-coloured wash, which is how a real Workvivo mobile
            header is dressed: the picture carries the company, the wash keeps the header
            the brand colour and keeps the white controls on it legible whatever the photo
            turns out to be. Both sit under the existing texture and scrim — see the
            z-index ladder in WorkvivoMobileStyles.css, which those two layers made
            explicit. */}
        <div className="wm-hero" style={hdr.style}>
          {/* A real <img>, not a background — the export drops CSS background photos
              (web/renderProbe.tsx). */}
          <img
            data-vc-slot="mobile.hero.0"
            className="wm-heroimg"
            src={image("mobile.hero.0", staticFile("fillers/190206084405_01_spotify_office_file_d0396b0d1b.webp"))}
            style={{ objectFit: "cover" }}
            alt=""
          />
          <div className="wm-herowash" />
          {hdr.showLogo && (
            <img className="wm-heroM" src={logo.onDark} alt={copy.companyName} />
          )}
          <div className="wm-heroV">{companyInitial}</div>
          {/* z4 in the old ladder: over the photo, letter and wash, under the
              z5 controls below. DOM order is what the export paints by. */}
          <div className="wm-hero-scrim" />
          <div className="wm-avstack"><img src={person.avatarUrl} style={person.avatarFit} alt="" /></div>
          <div className="wm-heroacts">
            <div className="wm-gbtn wm-plus"><i/><i/></div>
            <div className="wm-gbtn"><SymbolSvg width="16.5" height="16.5" href="#i-ui-employee-standalone" /></div>
          </div>
          <div className="wm-herotabs">
            <a href="#">Feed</a>
            <a href="#" className="wm-on">Spotlight<span className="wm-tab-underline" /></a>
          </div>
        </div>

        {/* AFTER the hero in the DOM, on purpose. The z ladder (status 5, hero 4)
            is what the Player paints by; the in-browser export paints DOM order and
            ignores sibling z-index, so the order here has to agree with the ladder or
            the export buries the status bar under the header photo. */}
        <div className="wm-status">
          <div className="wm-time">9:41</div>
          <div className="wm-sysico">
            <SymbolSvg width="17" height="11" href="#i-signal" />
            <SymbolSvg width="16" height="11" href="#i-wifi" />
            <SymbolSvg width="25" height="12" href="#i-battery" />
          </div>
        </div>
      </div>
    </div>
  );
};
import { GlassRing } from "./GlassRing";
import { SlotIcon } from "../../customize/SlotIcon";

// Feed this file's symbols into the inline registry (symbolRegistry.tsx): the hidden
// sprite above cannot be referenced across <svg> roots in the in-browser export, so
// every icon is drawn inlined instead and the sprite is kept only as a fallback.
registerSymbolJsx(<WorkvivoMobileSvgDefs />);
