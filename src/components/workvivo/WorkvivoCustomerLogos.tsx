import React from "react";
import { staticFile } from "remotion";

/**
 * High-fidelity vector logos for the Workvivo 16:9 square-tile Customer Logo Wall.
 * 7 rows x 13 columns matrix matching the reference layout.
 */

export const WorkvivoCenterLogo: React.FC<{ size?: number }> = ({ size = 68 }) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
    {/* Workvivo signature 3-slash emblem in brand red */}
    <rect x="28" y="52" width="16" height="50" rx="8" transform="rotate(-26 28 52)" fill="#E10613" />
    <rect x="68" y="20" width="16" height="86" rx="8" transform="rotate(-26 68 20)" fill="#E10613" />
    <rect x="108" y="20" width="16" height="86" rx="8" transform="rotate(-26 108 20)" fill="#E10613" />
  </svg>
);

// --- Row 1 Logos ---
export const TrajanLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="90" height="32">
    <polygon points="18,14 26,26 10,26" fill="#DC2626" />
    <text x="36" y="28" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="15" fontWeight="800" letterSpacing="1px" fill="#111827">
      TRAJAN
    </text>
  </svg>
);

export const VisyLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="34">
    <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Arial Black', Impact, sans-serif" fontSize="20" fontWeight="900" fill="#1D4ED8">
      VISY
    </text>
    <text x="50%" y="76%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="5.5" fontWeight="700" letterSpacing="0.5px" fill="#1E3A8A">
      FOR A BETTER WORLD
    </text>
  </svg>
);

export const HubooLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <rect x="14" y="14" width="16" height="16" rx="3" fill="none" stroke="#7C3AED" strokeWidth="2" />
    <text x="38" y="29" fontFamily="-apple-system, sans-serif" fontSize="17" fontWeight="700" fill="#6D28D9">
      Huboo
    </text>
  </svg>
);

export const UtaLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="90" height="32">
    <text x="36" y="29" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="900" letterSpacing="1px" fill="#1D4ED8">
      UTA
    </text>
    <circle cx="92" cy="23" r="12" fill="none" stroke="#1D4ED8" strokeWidth="2.5" />
    <line x1="80" y1="23" x2="104" y2="23" stroke="#DC2626" strokeWidth="3" />
  </svg>
);

export const VirginLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="32">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Brush Script MT', 'Bickham Script Pro', cursive, sans-serif" fontSize="32" fontWeight="bold" fontStyle="italic" fill="#DC2626">
      Virgin
    </text>
  </svg>
);

export const ZailabLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Helvetica Neue', sans-serif" fontSize="19" fontWeight="800" fill="#E11D48">
      zai<span style={{ fontWeight: 400, color: "#111827" }}>lab</span>
    </text>
  </svg>
);

export const JamesWhelanLogo: React.FC = () => (
  <svg viewBox="0 0 150 50" width="90" height="30">
    <text x="12" y="24" fontFamily="serif" fontSize="18" fill="#B91C1C">🍽</text>
    <text x="36" y="22" fontFamily="'Times New Roman', serif" fontSize="10" fontWeight="900" fill="#7F1D1D">
      JAMES
    </text>
    <text x="36" y="32" fontFamily="'Times New Roman', serif" fontSize="8" fontWeight="700" fill="#7F1D1D">
      WHELAN
    </text>
  </svg>
);

export const KindredLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="16" y="28" fontFamily="sans-serif" fontSize="16" fill="#0D9488">*</text>
    <text x="32" y="28" fontFamily="sans-serif" fontSize="16" fontWeight="700" fill="#111827">
      kindred
    </text>
  </svg>
);

export const PortTaurangaLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="32">
    <circle cx="20" cy="24" r="9" fill="#0284C7" />
    <text x="38" y="22" fontFamily="sans-serif" fontSize="9" fontWeight="800" fill="#0369A1">
      Port of
    </text>
    <text x="38" y="32" fontFamily="sans-serif" fontSize="9" fontWeight="800" fill="#0369A1">
      Tauranga
    </text>
  </svg>
);

export const AirAsiaLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="34">
    <circle cx="70" cy="25" r="18" fill="#ED1C24" />
    <text x="70" y="30" textAnchor="middle" fontFamily="'Brush Script MT', cursive, sans-serif" fontSize="15" fontWeight="bold" fontStyle="italic" fill="#FFFFFF">
      AirAsia
    </text>
  </svg>
);

export const GxoLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="32">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Arial Black', Impact, sans-serif" fontSize="24" fontWeight="900" fill="#EA580C">
      GXO
    </text>
  </svg>
);

// --- Row 2 Logos ---
export const InghamsLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="32">
    <ellipse cx="70" cy="25" rx="38" ry="16" fill="#991B1B" />
    <text x="70" y="29" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="13" fontWeight="bold" fontStyle="italic" fill="#FFFFFF">
      INGHAM&apos;S
    </text>
  </svg>
);

export const IrishRailLogo: React.FC = () => (
  <svg viewBox="0 0 180 50" width="95" height="32">
    <g transform="translate(10, 8)">
      <polygon points="0,18 14,0 24,0 10,18" fill="#00A651" />
      <polygon points="12,18 26,0 34,0 20,18" fill="#8DC63F" />
    </g>
    <text x="52" y="20" fontFamily="Arial, sans-serif" fontSize="10.5" fontWeight="800" fill="#1B1B1B">
      Iarnród Éireann
    </text>
    <text x="52" y="32" fontFamily="Arial, sans-serif" fontSize="10.5" fontWeight="800" fill="#00A651">
      Irish Rail
    </text>
  </svg>
);

export const BusEireannLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="90" height="32">
    <g transform="translate(56, 4)">
      <path d="M4,10 Q14,3 24,8 Q32,4 38,10 Q28,14 16,12 Z" fill="#D92128" />
    </g>
    <text x="75" y="34" textAnchor="middle" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="14" fontWeight="800" fontStyle="italic" fill="#007A3D">
      Bus Éireann
    </text>
  </svg>
);

export const VirginAustraliaLogo: React.FC = () => (
  <svg viewBox="0 0 180 50" width="95" height="30">
    <text x="45" y="30" fontFamily="'Brush Script MT', cursive, sans-serif" fontSize="28" fontWeight="bold" fill="#CC0000" fontStyle="italic">
      Virgin
    </text>
    <text x="96" y="28" fontFamily="sans-serif" fontSize="9.5" fontWeight="600" fill="#666666">
      australia
    </text>
  </svg>
);

export const ExosLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="20" fontWeight="800" letterSpacing="4px" fill="#111111">
      EXOS
    </text>
  </svg>
);

export const UnipharLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="32">
    <g transform="translate(14, 10)">
      <circle cx="10" cy="10" r="4" fill="#1D4ED8" />
      <path d="M10 2 L10 6 M10 14 L10 18 M2 10 L6 10 M14 10 L18 10" stroke="#1D4ED8" strokeWidth="2.2" strokeLinecap="round" />
    </g>
    <text x="42" y="28" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="18" fontWeight="800" fill="#1E40AF">
      uniphar
    </text>
  </svg>
);

export const JamulCasinoLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="32">
    <path d="M70 6 C66 12, 64 17, 65 21 C67 25, 73 25, 75 21 C76 17, 74 12, 70 6 Z" fill="#0D9488" />
    <circle cx="70" cy="17" r="2.5" fill="#D97706" />
    <text x="70" y="33" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="13" fontWeight="800" letterSpacing="1.5px" fill="#831843">
      JAMUL
    </text>
    <text x="70" y="42" textAnchor="middle" fontFamily="'Helvetica Neue', sans-serif" fontSize="7" fontWeight="700" letterSpacing="2px" fill="#831843">
      CASINO
    </text>
  </svg>
);

export const ScootLogo: React.FC = () => (
  <svg viewBox="0 0 120 50" width="75" height="32">
    <circle cx="60" cy="25" r="20" fill="#FFE600" />
    <text x="60" y="30" textAnchor="middle" fontFamily="'Arial Rounded MT Bold', sans-serif" fontSize="14" fontWeight="900" fill="#111111">
      scoot
    </text>
  </svg>
);

export const IamsLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="32">
    <ellipse cx="70" cy="25" rx="38" ry="18" fill="#E54E18" />
    <text x="70" y="32" textAnchor="middle" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="20" fontWeight="900" fontStyle="italic" fill="#FFFFFF" letterSpacing="1px">
      IAMS
    </text>
  </svg>
);

// --- Row 3 Logos ---
export const AjinomotoLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="32">
    <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Brush Script MT', cursive, sans-serif" fontSize="24" fontWeight="bold" fill="#DC2626">
      Aj
    </text>
    <text x="50%" y="74%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="6.5" fontWeight="800" letterSpacing="1px" fill="#DC2626">
      AJINOMOTO
    </text>
  </svg>
);

export const WaldenLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="32">
    <g transform="translate(14, 10)">
      <circle cx="10" cy="10" r="9" fill="none" stroke="#16A34A" strokeWidth="2.5" />
      <circle cx="10" cy="10" r="4" fill="none" stroke="#16A34A" strokeWidth="2" />
    </g>
    <text x="44" y="27" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="16" fontWeight="800" letterSpacing="2px" fill="#0F172A">
      WALDEN
    </text>
  </svg>
);

export const WiderCircleLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="32">
    <path d="M12 25 Q18 14 24 25 T36 25 T48 25" fill="none" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
    <text x="56" y="29" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="700" fill="#1E293B">
      Wider Circle
    </text>
  </svg>
);

export const ArhLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="90" height="34">
    <path d="M72 8 L84 20 L58 20 Z" fill="#6B21A8" />
    <path d="M86 11 L98 20 L74 20 Z" fill="#A855F7" />
    <text x="80" y="32" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="16" fontWeight="900" letterSpacing="1.5px" fill="#581C87">
      ARH
    </text>
    <text x="80" y="41" textAnchor="middle" fontFamily="sans-serif" fontSize="5" fontWeight="600" fill="#6B7280">
      Appalachian Regional Healthcare
    </text>
  </svg>
);

export const SpringHealthLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <g transform="translate(12, 10)">
      <path d="M18 2 C8 2 2 10 2 18 C10 18 18 10 18 2 Z" fill="#10B981" />
    </g>
    <text x="38" y="27" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="700" fill="#064E3B">
      Spring Health
    </text>
  </svg>
);

export const FlexjetLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <text x="65" y="29" textAnchor="middle" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="16" fontWeight="800" fontStyle="italic" letterSpacing="2px" fill="#171717">
      FLEXJET
    </text>
    <line x1="112" y1="15" x2="126" y2="30" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const SkyCityLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Helvetica Neue', sans-serif" fontSize="17" fontWeight="800" fill="#111827">
      sky<span style={{ fontWeight: 400 }}>city</span>
    </text>
  </svg>
);

export const GrilldLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="34">
    <circle cx="70" cy="25" r="18" fill="#B91C1C" />
    <text x="70" y="30" textAnchor="middle" fontFamily="'Brush Script MT', cursive, sans-serif" fontSize="14" fontWeight="bold" fill="#FFFFFF">
      Grill&apos;d
    </text>
  </svg>
);

// --- Row 4 Logos (Center Row) ---
export const ChangiLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <g transform="translate(12, 10)">
      <circle cx="6" cy="6" r="5" fill="#F97316" />
      <circle cx="14" cy="6" r="5" fill="#EC4899" />
      <circle cx="10" cy="14" r="5" fill="#06B6D4" />
    </g>
    <text x="38" y="22" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="13" fontWeight="900" fill="#0F172A">
      CHANGI
    </text>
    <text x="38" y="32" fontFamily="sans-serif" fontSize="8" fontWeight="600" fill="#64748B">
      airport group
    </text>
  </svg>
);

export const ValorLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="70" y="28" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="19" fontWeight="900" letterSpacing="2px" fill="#111111">
      VALOR
    </text>
    <polygon points="70,7 72,12 78,12 73,15 75,20 70,17 65,20 67,15 62,12 68,12" fill="#111111" />
  </svg>
);

export const NhsRoyalBerkshireLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="34">
    <rect x="58" y="5" width="44" height="17" fill="#005EB8" rx="2" />
    <text x="80" y="18" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="bold" fontStyle="italic" fill="#FFFFFF">
      NHS
    </text>
    <text x="80" y="32" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8.5" fontWeight="800" fill="#005EB8">
      Royal Berkshire
    </text>
    <text x="80" y="41" textAnchor="middle" fontFamily="sans-serif" fontSize="6" fontWeight="600" fill="#475569">
      NHS Foundation Trust
    </text>
  </svg>
);

export const LondonAmbulanceLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="100" height="30">
    <circle cx="16" cy="25" r="11" fill="#065F46" />
    <circle cx="16" cy="25" r="9" fill="none" stroke="#FBBF24" strokeWidth="1.5" />
    <rect x="120" y="15" width="28" height="15" fill="#005EB8" rx="2" />
    <text x="134" y="26" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fontStyle="italic" fill="#FFFFFF">
      NHS
    </text>
    <text x="32" y="24" fontFamily="sans-serif" fontSize="7.5" fontWeight="800" fill="#1F2937">
      London Ambulance Service
    </text>
    <text x="32" y="33" fontFamily="sans-serif" fontSize="6.5" fontWeight="600" fill="#6B7280">
      NHS Trust
    </text>
  </svg>
);

export const FishLogo: React.FC = () => (
  <svg viewBox="0 0 120 50" width="75" height="32">
    <path d="M18 25 C32 12, 64 12, 80 25 C64 38, 32 38, 18 25 Z" fill="#1E3A8A" />
    <path d="M80 25 L92 14 L92 36 Z" fill="#1E3A8A" />
    <circle cx="34" cy="23" r="3" fill="#FFFFFF" />
    <path d="M46 16 Q56 25 46 34" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

export const AdelaideCrestLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="34">
    <circle cx="70" cy="25" r="16" fill="#FBBF24" stroke="#1E3A8A" strokeWidth="2" />
    <path d="M62 18 L70 12 L78 18 L78 28 L70 34 L62 28 Z" fill="#1E3A8A" />
    <text x="70" y="26" textAnchor="middle" fontFamily="sans-serif" fontSize="8" fontWeight="900" fill="#FFFFFF">
      AFC
    </text>
  </svg>
);

// --- Row 5 Logos ---
export const SentientJetLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <text x="14" y="28" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="12.5" fontWeight="700" letterSpacing="1px" fill="#111827">
      SENTIENT<span style={{ fontWeight: 300 }}>JET</span>
    </text>
    <polyline points="128,18 136,25 128,32" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const AirNavLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <path d="M12 28 Q20 10 28 28 Q20 18 12 28 Z" fill="#059669" />
    <path d="M18 30 Q26 12 34 30 Q26 20 18 30 Z" fill="#10B981" opacity="0.85" />
    <text x="40" y="23" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="12.5" fontWeight="900" fill="#0F172A">
      AIRNAV
    </text>
    <text x="40" y="32" fontFamily="sans-serif" fontSize="7" fontWeight="700" letterSpacing="1.5px" fill="#059669">
      IRELAND
    </text>
  </svg>
);

export const VolvoWordmarkLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="90" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Times New Roman', Georgia, serif" fontSize="19" fontWeight="bold" letterSpacing="6px" fill="#111111">
      VOLVO
    </text>
  </svg>
);

export const EmpirxHealthLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <g fill="#0284C7">
      <rect x="12" y="14" width="10" height="3" rx="1" />
      <rect x="12" y="19" width="14" height="3" rx="1" />
      <rect x="12" y="24" width="10" height="3" rx="1" />
      <rect x="12" y="29" width="7" height="3" rx="1" />
    </g>
    <text x="32" y="23" fontFamily="'Helvetica Neue', sans-serif" fontSize="13" fontWeight="900" fill="#0F172A">
      EMPIRX
    </text>
    <text x="32" y="33" fontFamily="'Helvetica Neue', sans-serif" fontSize="10" fontWeight="800" letterSpacing="1.5px" fill="#0284C7">
      HEALTH
    </text>
  </svg>
);

export const GreaterGoodHealthLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <g transform="translate(12, 10)">
      <circle cx="5" cy="5" r="4" fill="#0D9488" />
      <circle cx="13" cy="5" r="4" fill="#0D9488" />
      <circle cx="5" cy="13" r="4" fill="#0D9488" />
      <circle cx="13" cy="13" r="4" fill="#0D9488" />
    </g>
    <text x="34" y="20" fontFamily="sans-serif" fontSize="12" fontWeight="700" fill="#1E293B">
      greater
    </text>
    <text x="34" y="32" fontFamily="sans-serif" fontSize="12" fontWeight="800" fill="#0D9488">
      good health
    </text>
  </svg>
);

export const PmsLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <g transform="translate(10, 10)">
      <path d="M9 2 Q13 9 9 16 Q5 9 9 2 Z" fill="#0284C7" />
      <path d="M2 9 Q9 13 16 9 Q9 5 2 9 Z" fill="#F59E0B" />
    </g>
    <text x="32" y="22" fontFamily="'Helvetica Neue', sans-serif" fontSize="15" fontWeight="900" fill="#0369A1">
      PMS
    </text>
    <text x="32" y="31" fontFamily="sans-serif" fontSize="5" fontWeight="700" fill="#64748B">
      PRESBYTERIAN MEDICAL SERVICES
    </text>
  </svg>
);

export const PettittsLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="90" height="32">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Brush Script MT', cursive, serif" fontSize="28" fontWeight="bold" fontStyle="italic" fill="#111827">
      Pettitt&apos;s
    </text>
  </svg>
);

export const EndeavourGroupLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <circle cx="18" cy="25" r="10" fill="none" stroke="#64748B" strokeWidth="2" strokeDasharray="2.5 2.5" />
    <circle cx="18" cy="25" r="5" fill="#64748B" />
    <text x="34" y="22" fontFamily="sans-serif" fontSize="12" fontWeight="800" fill="#1E293B">
      endeavour
    </text>
    <text x="34" y="33" fontFamily="sans-serif" fontSize="10" fontWeight="600" fill="#64748B">
      group
    </text>
  </svg>
);

export const InsomniaCoffeeLogo: React.FC = () => (
  <svg viewBox="0 0 120 50" width="75" height="34">
    <circle cx="60" cy="25" r="20" fill="#C4161C" />
    <circle cx="54" cy="20" r="4" fill="#FFFFFF" />
    <circle cx="66" cy="20" r="4" fill="#FFFFFF" />
    <line x1="58" y1="20" x2="62" y2="20" stroke="#FFFFFF" strokeWidth="2" />
    <text x="60" y="32" textAnchor="middle" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="6.5" fontWeight="900" fill="#FFFFFF">
      INSOMNIA
    </text>
    <text x="60" y="38" textAnchor="middle" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="5" fontWeight="700" fill="#FFFFFF">
      COFFEE
    </text>
  </svg>
);

export const GordonFoodLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="32">
    <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Arial Black', Impact, sans-serif" fontSize="17" fontWeight="900" fill="#111827">
      Gordon
    </text>
    <text x="50%" y="74%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="7" fontWeight="800" letterSpacing="1px" fill="#111827">
      FOOD SERVICE
    </text>
  </svg>
);

// --- Row 6 Logos ---
export const AeroCloudLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <path d="M10 24 C10 18, 15 15, 20 15 C23 11, 28 11, 32 15 C37 15, 40 19, 39 24 Z" fill="#111111" />
    <text x="44" y="27" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="800" fill="#111111">
      AeroCloud
    </text>
  </svg>
);

export const HickorysLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="32">
    <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Playfair Display', Georgia, serif" fontSize="16" fontWeight="900" fill="#881337">
      HICKORY&apos;S
    </text>
    <text x="50%" y="76%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Helvetica Neue', sans-serif" fontSize="7" fontWeight="800" letterSpacing="2px" fill="#881337">
      SMOKEHOUSE
    </text>
  </svg>
);

export const AmFreshLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Helvetica Neue', sans-serif" fontSize="14" fontWeight="900" letterSpacing="1.5px" fill="#0F766E">
      AM FRESH
    </text>
    <text x="50%" y="76%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="7" fontWeight="700" letterSpacing="2px" fill="#14B8A6">
      GROUP
    </text>
  </svg>
);

export const BimedaLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <rect x="14" y="12" width="16" height="18" rx="3" fill="#0284C7" />
    <circle cx="22" cy="21" r="4" fill="#FFFFFF" />
    <text x="36" y="28" fontFamily="'Helvetica Neue', sans-serif" fontSize="16" fontWeight="800" fill="#0F172A">
      Bimeda
    </text>
  </svg>
);

export const HarrisFarmLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <rect x="8" y="7" width="144" height="30" rx="5" fill="#14532D" />
    <rect x="11" y="10" width="138" height="24" rx="3" fill="none" stroke="#F59E0B" strokeWidth="1" />
    <text x="80" y="22" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="10" fontWeight="900" fill="#FFFFFF">
      HARRIS FARM
    </text>
    <text x="80" y="31" textAnchor="middle" fontFamily="sans-serif" fontSize="6.5" fontWeight="800" letterSpacing="1.5px" fill="#FBBF24">
      MARKETS
    </text>
  </svg>
);

export const WoodiesLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <rect x="8" y="5" width="124" height="32" rx="7" fill="#15803D" />
    <text x="70" y="28" textAnchor="middle" fontFamily="'Arial Rounded MT Bold', sans-serif" fontSize="19" fontWeight="900" fontStyle="italic" fill="#FACC15">
      Woodie&apos;s
    </text>
  </svg>
);

export const KokoBlackLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="26">
    <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="13" fontWeight="900" letterSpacing="3.5px" fill="#111111">
      KOKO BLACK
    </text>
  </svg>
);

export const WincLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Arial Black', Impact, sans-serif" fontSize="22" fontWeight="900" fill="#E11D48">
      winc.
    </text>
  </svg>
);

export const SanDiegoAirportLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <path d="M12 10 L22 30 L8 30 Z" fill="#0284C7" />
    <path d="M16 14 L24 30 L14 30 Z" fill="#F59E0B" opacity="0.85" />
    <text x="28" y="21" fontFamily="sans-serif" fontSize="9.5" fontWeight="900" fill="#0F172A">
      SAN DIEGO
    </text>
    <text x="28" y="30" fontFamily="sans-serif" fontSize="6.5" fontWeight="700" letterSpacing="0.8px" fill="#64748B">
      AIRPORT
    </text>
  </svg>
);

// --- Row 7 Logos ---
export const AerLingusLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <text x="14" y="28" fontFamily="'Helvetica Neue', sans-serif" fontSize="13" fontWeight="700" fill="#047857">
      Aer Lingus
    </text>
    <text x="108" y="28" fontSize="14" fill="#10B981">☘</text>
  </svg>
);

export const ModernMarketLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Times New Roman', serif" fontSize="9" fontWeight="800" letterSpacing="1px" fill="#1E3A8A">
      MODERN MARKET
    </text>
    <text x="50%" y="74%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Times New Roman', serif" fontSize="12" fontWeight="900" letterSpacing="1.5px" fill="#1E3A8A">
      GARDEN
    </text>
  </svg>
);

export const SaltStrawLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Brush Script MT', cursive, serif" fontSize="19" fontWeight="bold" fontStyle="italic" fill="#DC2626">
      Salt &amp; Straw
    </text>
  </svg>
);

export const GskLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="80" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Arial Black', Impact, sans-serif" fontSize="22" fontWeight="900" fill="#EA580C">
      GSK
    </text>
  </svg>
);

export const ScopeLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="17" fontWeight="900" letterSpacing="2px" fill="#0284C7">
      SC<span style={{ color: "#E11D48" }}>O</span>PE
    </text>
  </svg>
);

export const IcelandLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Arial Black', sans-serif" fontSize="19" fontWeight="900" fill="#DC2626">
      Iceland
    </text>
  </svg>
);

export const RueGiltLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Times New Roman', serif" fontSize="11" fontWeight="800" letterSpacing="1px" fill="#111827">
      RUE GILT
    </text>
    <text x="50%" y="74%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="7" fontWeight="600" letterSpacing="2px" fill="#6B7280">
      GROUPE
    </text>
  </svg>
);

export const BishsRvLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="32">
    <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Arial Black', Impact, sans-serif" fontSize="16" fontWeight="900" fill="#111827">
      BISH&apos;S
    </text>
    <text x="50%" y="75%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="7" fontWeight="800" fill="#DC2626">
      RV
    </text>
  </svg>
);

export const MaxiZooLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <circle cx="16" cy="25" r="4" fill="#059669" />
    <text x="26" y="29" fontFamily="'Arial Rounded MT Bold', sans-serif" fontSize="15" fontWeight="900" fill="#047857">
      maxi zoo
    </text>
  </svg>
);

export const ThirtyOneLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="'Brush Script MT', cursive, sans-serif" fontSize="20" fontWeight="bold" fontStyle="italic" fill="#DB2777">
      thirty-one
    </text>
  </svg>
);

export const SportEndeavoursLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <text x="14" y="24" fontFamily="'Arial Black', sans-serif" fontSize="18" fontWeight="900" fill="#DC2626">
      S
    </text>
    <text x="34" y="20" fontFamily="sans-serif" fontSize="9" fontWeight="800" fill="#1E3A8A">
      SPORT
    </text>
    <text x="34" y="30" fontFamily="sans-serif" fontSize="7" fontWeight="700" fill="#64748B">
      ENDEAVOURS
    </text>
  </svg>
);

// --- Wordmark-only logos, wrapped in <svg> ---
// These were previously bare <text> elements inline in CUSTOMER_GRID_ROWS with no
// enclosing <svg> — invalid outside an SVG namespace context, so the browser never
// rendered them and the cards were blank. Same text/style, now inside a real <svg>.

export const TrainCorpLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="90" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="13" fontWeight="800" fill="#111827">
      TrainCorp
    </text>
  </svg>
);

export const FraportLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="90" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="13" fontWeight="800" fill="#0369A1">
      Fraport
    </text>
  </svg>
);

export const CordellLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="90" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="serif" fontSize="14" fontWeight="700" fill="#111827">
      Cordell
    </text>
  </svg>
);

export const EviLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="16" fontWeight="900" fill="#0284C7">
      EVI
    </text>
  </svg>
);

export const StermanLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="90" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="13" fontWeight="700" fill="#111827">
      STERMAN
    </text>
  </svg>
);

export const MedaLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="14" fontWeight="700" fill="#0369A1">
      Meda
    </text>
  </svg>
);

export const AdelaideLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="90" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="13" fontWeight="800" fill="#0284C7">
      Adelaide
    </text>
  </svg>
);

export const GroupBrandLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="13" fontWeight="800" fill="#111827">
      GROUP
    </text>
  </svg>
);

export const EmaLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="serif" fontSize="15" fontWeight="700" fill="#111827">
      EMA
    </text>
  </svg>
);

export const XilLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="16" fontWeight="900" fill="#EA580C">
      XIL
    </text>
  </svg>
);

export const TopoLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="85" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="13" fontWeight="800" fill="#111827">
      TOPO
    </text>
  </svg>
);

export const StarliteLogo: React.FC = () => (
  <svg viewBox="0 0 140 50" width="90" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="serif" fontSize="13" fontStyle="italic" fill="#111827">
      Starlite
    </text>
  </svg>
);

export const CorpWingsLogo: React.FC = () => (
  <svg viewBox="0 0 160 50" width="95" height="30">
    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="serif" fontSize="10" fontWeight="700" fill="#B91C1C">
      Corporate Wings
    </text>
  </svg>
);

/** Complete 7-row x 13-column matrix of customer cards */
export const CUSTOMER_GRID_ROWS: Array<Array<{ id: string; name: string; component?: React.ReactNode; src?: string }>> = [
  // ROW 1
  [
    { id: "traincorp", name: "TrainCorp", component: <TrainCorpLogo /> },
    { id: "trajan", name: "TRAJAN", src: "img/customer-logos/trajan.png" },
    { id: "visy", name: "VISY", src: "img/customer-logos/visy.png" },
    { id: "huboo", name: "Huboo", src: "img/customer-logos/huboo.png" },
    { id: "uta", name: "UTA", src: "img/customer-logos/uta.png" },
    { id: "virgin", name: "Virgin", src: "img/customer-logos/virgin.png" },
    { id: "zailab", name: "zailab", src: "img/customer-logos/zailab.png" },
    { id: "james_whelan", name: "James Whelan", src: "img/customer-logos/james-whelan.png" },
    { id: "kindred", name: "kindred", src: "img/customer-logos/kindred.png" },
    { id: "port_tauranga", name: "Port of Tauranga", src: "img/customer-logos/port-of-tauranga.png" },
    { id: "airasia", name: "AirAsia", src: "img/customer-logos/airasia.png" },
    { id: "gxo", name: "GXO", src: "img/customer-logos/gxo.png" },
    { id: "fraport", name: "Fraport", component: <FraportLogo /> },
  ],
  // ROW 2
  [
    { id: "cordell", name: "Cordell", component: <CordellLogo /> },
    { id: "inghams", name: "Ingham's", src: "img/customer-logos/inghams.png" },
    { id: "irish_rail", name: "Iarnród Éireann", src: "img/customer-logos/irish-rail.png" },
    { id: "bus_eireann", name: "Bus Éireann", src: "img/customer-logos/bus-eireann.png" },
    { id: "virgin_australia", name: "Virgin Australia", src: "img/customer-logos/virgin-australia.png" },
    { id: "fujifilm", name: "FUJIFILM", src: "img/customer-logos/fujifilm-biosciences.png" },
    { id: "exos", name: "EXOS", src: "img/customer-logos/exos.png" },
    { id: "uniphar", name: "Uniphar", src: "img/customer-logos/uniphar.png" },
    { id: "amazon", name: "Amazon", src: "img/customer-logos/amazon.png" },
    { id: "jamul_casino", name: "Jamul Casino", src: "img/customer-logos/jamul-casino.png" },
    { id: "scoot", name: "Scoot", src: "img/customer-logos/scoot.png" },
    { id: "melbourne_airport_1", name: "Melbourne Airport", src: "img/customer-logos/melbourne-airport.png" },
    { id: "evi", name: "EVI", component: <EviLogo /> },
  ],
  // ROW 3
  [
    { id: "sterman", name: "Sterman", component: <StermanLogo /> },
    { id: "ajinomoto", name: "Ajinomoto", src: "img/customer-logos/ajinomoto.png" },
    { id: "walden", name: "Walden", src: "img/customer-logos/walden.png" },
    { id: "air_india", name: "Air India", src: "img/customer-logos/air-india.png" },
    { id: "walmart", name: "Walmart", src: "img/customer-logos/walmart.png" },
    { id: "wider_circle", name: "Wider Circle", src: "img/customer-logos/wider-circle.png" },
    { id: "arh", name: "ARH", src: "img/customer-logos/appalachian-regional-healthcare.png" },
    { id: "spring_health", name: "Spring Health", src: "img/customer-logos/spring-health.png" },
    { id: "white_castle", name: "White Castle", src: "img/customer-logos/white-castle.png" },
    { id: "delta", name: "Delta", src: "img/customer-logos/delta.png" },
    { id: "flexjet_1", name: "Flexjet", src: "img/customer-logos/flexjet.png" },
    { id: "skycity", name: "SkyCity", src: "img/customer-logos/skycity.png" },
    // No matching file in the refreshed set — kept on its original drawn component.
    { id: "grilld", name: "Grill'd", component: <GrilldLogo /> },
  ],
  // ROW 4 (CENTER HERO ROW)
  [
    { id: "meda", name: "Meda", component: <MedaLogo /> },
    { id: "melbourne_airport_2", name: "Melbourne Airport", src: "img/customer-logos/melbourne-airport-alt.png" },
    { id: "changi", name: "Changi Airport Group", src: "img/customer-logos/changi-airport-group.png" },
    { id: "ryanair", name: "Ryanair", src: "img/customer-logos/ryanair.png" },
    { id: "valor", name: "Valor", src: "img/customer-logos/valor.png" },
    { id: "nhs_royal_berkshire", name: "NHS Royal Berkshire", src: "img/customer-logos/nhs-royal-berkshire.png" },
    // CENTER HERO: the refreshed set includes a purpose-named center-featured-mark.png.
    { id: "workvivo_center", name: "Workvivo", src: "img/customer-logos/center-featured-mark.png" },
    { id: "bupa", name: "Bupa", src: "img/customer-logos/bupa.png" },
    { id: "london_ambulance", name: "NHS London Ambulance Service", src: "img/customer-logos/london-ambulance-service.png" },
    { id: "amc", name: "AMC Theatres", src: "img/customer-logos/amc-theatres.png" },
    { id: "fish", name: "Fish", src: "img/customer-logos/unidentified-fish-mark.png" },
    { id: "adelaide_crest", name: "Adelaide Crows", src: "img/customer-logos/unidentified-crest.png" },
    { id: "adelaide", name: "Adelaide", component: <AdelaideLogo /> },
  ],
  // ROW 5
  [
    { id: "group_brand", name: "Group", component: <GroupBrandLogo /> },
    { id: "sentient_jet", name: "Sentient Jet", src: "img/customer-logos/sentientjet.png" },
    { id: "airnav_ireland", name: "AirNav Ireland", src: "img/customer-logos/airnav-ireland.png" },
    { id: "wizz", name: "Wizz Air", src: "img/customer-logos/wizz-air.png" },
    { id: "volvo", name: "VOLVO", src: "img/customer-logos/volvo.png" },
    { id: "empirx", name: "Empirx Health", src: "img/customer-logos/empirx-health.png" },
    { id: "greater_good", name: "Greater Good Health", src: "img/customer-logos/greater-good-health.png" },
    { id: "pms", name: "PMS", src: "img/customer-logos/pms-presbyterian-medical-services.png" },
    { id: "pettitts", name: "Pettitt's", src: "img/customer-logos/pettitts.png" },
    { id: "endeavour_group", name: "Endeavour Group", src: "img/customer-logos/endeavour-group.png" },
    { id: "insomnia", name: "Insomnia Coffee", src: "img/customer-logos/insomnia-coffee.png" },
    { id: "gordon_food", name: "Gordon Food Service", src: "img/customer-logos/gordon-food-service.png" },
    { id: "ema", name: "EMA", component: <EmaLogo /> },
  ],
  // ROW 6
  [
    { id: "xil", name: "XIL", component: <XilLogo /> },
    { id: "san_diego_airport", name: "San Diego Airport", src: "img/customer-logos/san-diego-international-airport.png" },
    { id: "aerocloud", name: "AeroCloud", src: "img/customer-logos/aerocloud.png" },
    { id: "hickorys", name: "Hickory's Smokehouse", src: "img/customer-logos/hickorys-smokehouse.png" },
    { id: "am_fresh", name: "AM FRESH Group", src: "img/customer-logos/am-fresh-group.png" },
    { id: "aib", name: "AIB", src: "img/customer-logos/aib.png" },
    { id: "bimeda", name: "Bimeda", src: "img/customer-logos/bimeda.png" },
    { id: "harris_farm", name: "Harris Farm Markets", src: "img/customer-logos/harris-farm-markets.png" },
    { id: "woodies", name: "Woodie's", src: "img/customer-logos/woodies.png" },
    { id: "kmart", name: "Kmart", src: "img/customer-logos/kmart.png" },
    { id: "koko_black", name: "Koko Black", src: "img/customer-logos/koko-black.png" },
    { id: "winc", name: "Winc", src: "img/customer-logos/winc.png" },
    { id: "topo", name: "TOPO", component: <TopoLogo /> },
  ],
  // ROW 7
  [
    { id: "starlite", name: "Starlite", component: <StarliteLogo /> },
    { id: "corp_wings", name: "Corporate Wings", src: "img/customer-logos/corporate-wings.png" },
    { id: "aer_lingus", name: "Aer Lingus", src: "img/customer-logos/aer-lingus.png" },
    // The only candidate file for this slot was "madison-square-garden.png" — a real,
    // unrelated venue, not a match for "Modern Market Garden". Not wired: kept on its
    // original drawn component rather than risk mislabeling the wrong company.
    { id: "modern_market", name: "Modern Market Garden", component: <ModernMarketLogo /> },
    { id: "salt_straw", name: "Salt & Straw", src: "img/customer-logos/salt-and-straw.png" },
    { id: "gsk", name: "GSK", src: "img/customer-logos/gsk.png" },
    { id: "scope", name: "SCOPE", src: "img/customer-logos/scope.png" },
    { id: "iceland", name: "Iceland", src: "img/customer-logos/iceland.png" },
    { id: "rue_gilt", name: "Rue Gilt Groupe", src: "img/customer-logos/rue-gilt-groupe.png" },
    { id: "bishs_rv", name: "Bish's RV", src: "img/customer-logos/bishs-rv.png" },
    { id: "maxi_zoo", name: "Maxi Zoo", src: "img/customer-logos/maxi-zoo.png" },
    { id: "thirty_one", name: "Thirty-One", src: "img/customer-logos/thirty-one.png" },
    // No matching file in the refreshed set — kept on its original drawn component.
    { id: "sport_endeavours", name: "Sport Endeavours", component: <SportEndeavoursLogo /> },
  ],
];
