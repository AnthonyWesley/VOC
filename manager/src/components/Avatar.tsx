import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

type AvatarUploaderProps = {
  name?: string;
  icon?: string;
  image?: string;
  size?: string;
  className?: string;
  ringStyle?: string;
  onUpload?: (file: File) => Promise<any>;
  onSuccess?: (data: any) => void;
};

export default function Avatar({
  name,
  icon,
  image,
  size = "90",
  className,
  onUpload,
  onSuccess,
  ringStyle,
}: AvatarUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(image ?? null);
  const [loading, setLoading] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [src, setSrc] = useState<string>();
  const [crop, setCrop] = useState<Crop>({
    x: 50,
    y: 50,
    width: 250,
    height: 250,
    unit: "px",
  });
  const imgRef = useRef<HTMLImageElement>(null);
  const pixelCropRef = useRef<PixelCrop>({
    x: 50,
    y: 50,
    width: 250,
    height: 250,
    unit: "px",
  });

  const numericSize = Number(size);
  const avatarStyle = {
    width: `${numericSize}px`,
    height: `${numericSize}px`,
    fontSize: `${numericSize * 0.3}px`,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result as string);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
  };

  const onCropComplete = (c: PixelCrop) => {
    pixelCropRef.current = c;
  };

  const getCroppedFile = async (): Promise<File | null> => {
    if (!imgRef.current || !pixelCropRef.current) return null;
    const image = imgRef.current;
    const crop = pixelCropRef.current;

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        resolve(file);
      }, "image/jpeg");
    });
  };

  useEffect(() => {
    setPreviewUrl(image ?? null);
  }, [image]);

  const handleCropConfirm = async () => {
    const file = await getCroppedFile();
    if (!file) {
      toast.error("Erro ao processar imagem.");
      return;
    }

    setLoading(true);
    try {
      const result = await onUpload?.(file);
      const uploadedUrl = result?.data?.photo ?? URL.createObjectURL(file);
      setPreviewUrl(uploadedUrl);
      toast("Upload feito com sucesso!");
      onSuccess?.(result);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar imagem.");
    } finally {
      setLoading(false);
      setIsCropOpen(false);
    }
  };

  const getInitials = () => (name ? name[0].toUpperCase() : "?");

  return (
    <div
      className={`group relative inline-block aspect-square flex-shrink-0 rounded-full border border-gray-500/50 p-[1px] ${ringStyle}`}
    >
      <div
        style={avatarStyle}
        className={`flex items-center justify-center overflow-hidden rounded-full bg-slate-950/40 text-[var(--text-primary)] ${className}`}
      >
        {previewUrl ? (
          <img
            key={src}
            src={previewUrl}
            alt={name ?? ""}
            className="h-full w-full object-cover"
          />
        ) : icon ? (
          <Icon icon={icon} className="h-[40%] w-[40%]" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-bold">
            {getInitials()}
          </span>
        )}
      </div>

      {onUpload && (
        <label
          htmlFor={src}
          className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 transition-opacity ${
            loading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {loading ? (
            <div className="h-[40%] w-[40%] animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <span className="rounded bg-black/70 px-2 py-1 text-[var(--text-primary)]">
              Alterar
            </span>
          )}
          <input
            key={src}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {isCropOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-2">
          <div className="relative flex w-full max-w-lg flex-col items-center rounded-lg border border-gray-500/25 bg-slate-950/95 p-4 shadow-lg">
            <h2 className="mb-4 font-bold">Cortar imagem</h2>

            {loading && (
              <div className="absolute z-[99999] mt-10 h-80 w-80 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}

            {src && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={onCropComplete}
                aspect={1}
                circularCrop
                keepSelection
              >
                <img
                  src={src}
                  alt="Crop"
                  onLoad={onImageLoad}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "70vh", // limita a altura da imagem à 70% da altura da viewport
                    objectFit: "contain",
                  }}
                />
              </ReactCrop>
            )}

            <div className="mt-6 flex w-full justify-end gap-3">
              <button
                className="rounded-md bg-gray-400 px-4 py-2 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setIsCropOpen(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                disabled={loading}
                className="rounded-md bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700 disabled:opacity-50"
                onClick={handleCropConfirm}
              >
                {!loading ? "Confirmar" : "Enviando..."}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
