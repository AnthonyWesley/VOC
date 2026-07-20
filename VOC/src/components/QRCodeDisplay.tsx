export default function QRCodeDisplay({
  base64String,
}: {
  base64String: string;
}) {
  const src = base64String.startsWith("data:image")
    ? base64String
    : `data:image/png;base64,${base64String}`;

  return (
    <div className="w-90 rounded-lg bg-slate-900/95">
      <img src={src} alt="QR Code" className="w-full p-8" />
    </div>
  );
}
