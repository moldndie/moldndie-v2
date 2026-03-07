import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:h-screen md:grid md:grid-cols-2">
      {/* Left panel - Image (hidden below md) */}
      <div className="hidden md:flex items-center justify-center bg-white p-8">
        <div className="relative w-full h-full rounded-3xl overflow-hidden">
          <Image
            src="/assets/auth-layout-banner.svg"
            alt="Authentication layout banner"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Right panel - Forms */}
      <div className="relative bg-white flex items-center justify-center px-6 py-12 md:px-10 overflow-y-auto min-h-screen md:min-h-0">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
