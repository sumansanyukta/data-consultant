import Image from "next/image";

export function Logo({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? 100 : size === "md" ? 140 : 180;

  return (
    <Image
      src="/unwritten_data_logo.png"
      alt="Unwritten Data"
      width={dims}
      height={dims}
      className="object-contain"
      priority
    />
  );
}

export function LogoIcon({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/unwritten_data_logo.png"
      alt="Unwritten Data"
      width={size}
      height={size}
      className="object-contain"
      priority
    />
  );
}
