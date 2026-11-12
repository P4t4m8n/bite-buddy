import Image from "next/image";

type AvatarProps = { name: string | null; image: string | null; size?: number };

export function Avatar({ name, image, size = 32 }: AvatarProps) {
  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  const initial = name?.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground"
    >
      {initial}
    </span>
  );
}
