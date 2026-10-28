'use client';

import { useId, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./CertificateOfCompletion.css";

const WIDTH = 1123;
const HEIGHT = 794;

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface Signer {
  name: string;
  title: string;
  /** Path/URL of the signature (transparent PNG) */
  signatureSrc: string;
  /** Height of the signature image in px (default 46) */
  signatureHeight?: number;
}

const DEFAULT_SIGNERS: [Signer, Signer] = [
  { name: "Jha Suraj Kumar", title: "Founder, Hacker’s Unity", signatureSrc: "https://res.cloudinary.com/p6qljeni/image/upload/v1793191141/hackers-unity/signatures/suraj-signature.png", signatureHeight: 58 },
  { name: "Chinmay Bhatt", title: "Co-founder, Hacker’s Unity", signatureSrc: "https://res.cloudinary.com/p6qljeni/image/upload/v1793191143/hackers-unity/signatures/chinmay-signature.png" },
];

export interface CertificateOfCompletionProps {
  /** Full name of the user who completed their profile */
  recipientName: string;
  /** Completion date. Defaults to today. */
  completionDate?: Date | string;
  /** Unique certificate ID (use your DB id so it can be verified). Random if omitted. */
  certificateId?: string;
  /** Path/URL of the Hacker's Unity logo */
  logoSrc?: string;
  /** Two signers, shown left and right of the medal */
  signers?: [Signer, Signer];
  /** Words shown in the pills under the paragraph */
  highlights?: string[];
  /** Scale the certificate down to fit its container (mobile friendly). Default true. */
  scaleToFit?: boolean;
  className?: string;
}

function formatDate(value: Date | string): string {
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
}

function makeCertificateId(): string {
  return `HU-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function starburstPoints(teeth = 36, outer = 76, inner = 69, c = 80): string {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / teeth;
    pts.push(`${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

function Check({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill={color} />
      <path
        d="M5.5 10.3l3 3 6-6.6"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CertificateOfCompletion({
  recipientName,
  completionDate,
  certificateId,
  logoSrc = "https://res.cloudinary.com/p6qljeni/image/upload/v1793191150/hackers-unity/branding/hackers-unity-logo.png",
  signers = DEFAULT_SIGNERS,
  highlights = ["Build", "Create", "Collaborate"],
  scaleToFit = true,
  className,
}: CertificateOfCompletionProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradBlueOrange = `hu-g-${rawId}`;
  const gradOrange = `hu-o-${rawId}`;

  const dateText = useMemo(() => formatDate(completionDate ?? new Date()), [completionDate]);
  const certId = useMemo(() => certificateId ?? makeCertificateId(), [certificateId]);
  const star = useMemo(() => starburstPoints(), []);

  // Scale to fit container width
  const fitRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useIsomorphicLayoutEffect(() => {
    if (!scaleToFit || !fitRef.current) return;
    const el = fitRef.current;
    const update = () => {
      if (el && el.clientWidth > 0) {
        setScale(Math.min(1, el.clientWidth / WIDTH));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scaleToFit]);

  const s = scaleToFit ? scale : 1;

  return (
    <div
      ref={fitRef}
      className={`hu-cert-fit ${className ?? ""}`}
      style={{ height: HEIGHT * s }}
    >
      <div className="hu-cert-scale" style={{ width: WIDTH, height: HEIGHT, transform: `scale(${s})` }}>
        <div className="hu-cert" role="img" aria-label={`Certificate of Completion for ${recipientName}`}>
          <div className="hu-dots" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hu-wm" src={logoSrc} alt="" />
          <div className="hu-frame">
            <i className="hu-c1" />
            <i className="hu-c2" />
          </div>

          <div className="hu-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="hu-logo" src={logoSrc} alt="Hacker’s Unity logo" />
            <h1 className="hu-title">Certificate of Completion</h1>
            <p className="hu-pre">This certificate is proudly presented to</p>
            <div className="hu-name">{recipientName || "Hacker"}</div>

            <p className="hu-body">
              for completing <b>100% of their profile</b> on Hacker’s Unity.
              <span>
                By sharing their background, education and experience, they are now fully set up to
                join hackathons, team up with fellow builders and grow with the community.
              </span>
            </p>

            <ul className="hu-chips">
              {highlights.map((word, i) => (
                <li key={word}>
                  <Check color={i === highlights.length - 1 ? "#f58220" : "#0a9ed9"} />
                  {word}
                </li>
              ))}
            </ul>

            <div className="hu-foot">
              <div className="hu-sig">
                <div className="hu-sig-top">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={signers[0].signatureSrc} alt={`Signature of ${signers[0].name}`} style={{ height: signers[0].signatureHeight ?? 46 }} />
                </div>
                <i className="hu-rule" />
                <b>{signers[0].name}</b>
                <small>{signers[0].title}</small>
              </div>

              <svg className="hu-medal" viewBox="0 0 160 190" role="img" aria-label="Profile 100% complete">
                <defs>
                  <linearGradient id={gradBlueOrange} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#0a9ed9" />
                    <stop offset="1" stopColor="#f58220" />
                  </linearGradient>
                  <linearGradient id={gradOrange} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ffa64d" />
                    <stop offset="1" stopColor="#f58220" />
                  </linearGradient>
                </defs>
                <g transform="rotate(12 66 112)">
                  <polygon points="52,108 80,108 80,186 66,172 52,186" fill="#0a9ed9" />
                </g>
                <g transform="rotate(-12 94 112)">
                  <polygon points="80,108 108,108 108,186 94,172 80,186" fill="#f58220" />
                </g>
                <polygon points={star} fill={`url(#${gradOrange})`} />
                <circle cx="80" cy="80" r="62" fill="#fff" />
                <circle cx="80" cy="80" r="56" fill="#000" />
                <circle cx="80" cy="80" r="47" fill="none" stroke="#2f2f2f" strokeWidth="5" />
                <circle
                  className="hu-ring"
                  cx="80"
                  cy="80"
                  r="47"
                  fill="none"
                  stroke={`url(#${gradBlueOrange})`}
                  strokeWidth="5"
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                  pathLength={100}
                  style={{ strokeDasharray: 100 }}
                />
                <circle cx="80" cy="56" r="9" fill={`url(#${gradBlueOrange})`} />
                <path
                  d="M75.5 56.3l3.3 3.3 5.8-6.4"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <text x="80" y="92" textAnchor="middle" fill="#fff" fontFamily="Bricolage Grotesque, sans-serif" fontWeight={800} fontSize="27">
                  100%
                </text>
                <text x="80" y="107" textAnchor="middle" fill="#cfd5db" fontFamily="Bricolage Grotesque, sans-serif" fontWeight={600} fontSize="10.5">
                  complete
                </text>
              </svg>

              <div className="hu-sig">
                <div className="hu-sig-top">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={signers[1].signatureSrc} alt={`Signature of ${signers[1].name}`} style={{ height: signers[1].signatureHeight ?? 46 }} />
                </div>
                <i className="hu-rule" />
                <b>{signers[1].name}</b>
                <small>{signers[1].title}</small>
              </div>
            </div>
          </div>

          <div className="hu-verify">
            Issued on <b>{dateText}</b> &nbsp;|&nbsp; Verify at <b>hackersunity.com</b> &nbsp;|&nbsp; Certificate ID: {certId}
          </div>
        </div>
      </div>
    </div>
  );
}
