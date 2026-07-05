import { CATALOG, PREMIUM_ITEMS, useGame } from "../store/gameStore";

/** Look up a cosmetic item across both catalogs. */
export function findCosmetic(id: string | null) {
  if (!id) return undefined;
  return (
    CATALOG.find((i) => i.id === id) ?? PREMIUM_ITEMS.find((i) => i.id === id)
  );
}

/**
 * The single persistent avatar, rendered as inline SVG so cosmetics
 * (top color, hat, accessory) can be applied without image assets.
 */
export default function Avatar({ size = 120 }: { size?: number }) {
  const avatar = useGame((g) => g.state.avatar);
  const top = findCosmetic(avatar.equipped.top);
  const hat = findCosmetic(avatar.equipped.hat);
  const accessory = findCosmetic(avatar.equipped.accessory);
  const shirt = top?.color ?? "#9aa7b8";

  return (
    <div className="avatar" style={{ width: size }}>
      <svg
        viewBox="0 0 100 130"
        width={size}
        height={size * 1.3}
        role="img"
        aria-label={`Avatar: ${avatar.name}`}
      >
        {/* legs */}
        <rect x="38" y="95" width="9" height="28" rx="4" fill="#5c5470" />
        <rect x="53" y="95" width="9" height="28" rx="4" fill="#5c5470" />
        {/* body / top */}
        <rect x="30" y="58" width="40" height="42" rx="12" fill={shirt} />
        {/* arms */}
        <rect x="20" y="62" width="9" height="30" rx="4.5" fill={shirt} />
        <rect x="71" y="62" width="9" height="30" rx="4.5" fill={shirt} />
        {/* head */}
        <circle cx="50" cy="36" r="20" fill={avatar.skinTone} />
        {/* hair */}
        <path
          d="M30 34 a20 20 0 0 1 40 0 q0 -6 -6 -9 a22 16 0 0 0 -28 0 q-6 3 -6 9"
          fill={avatar.hairColor}
        />
        {/* face */}
        <circle cx="43" cy="36" r="2.2" fill="#33302e" />
        <circle cx="57" cy="36" r="2.2" fill="#33302e" />
        <path
          d="M44 45 q6 5 12 0"
          stroke="#33302e"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      {hat && (
        <span className="avatar-hat" aria-hidden>
          {hat.emoji}
        </span>
      )}
      {accessory && (
        <span className="avatar-accessory" aria-hidden>
          {accessory.emoji}
        </span>
      )}
      <div className="avatar-name">{avatar.name}</div>
    </div>
  );
}
