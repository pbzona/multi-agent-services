import Image from "next/image";

type ArtworkSize = "card" | "detail" | "mini";

const PRODUCT_PHOTOS: Record<
  string,
  { alt: string; position?: string; src: string }
> = {
  "arc-task-chair": {
    alt: "White mesh task chair in a bright home office",
    position: "50% 48%",
    src: "/products/arc-task-chair.jpg",
  },
  "beam-monitor-arm": {
    alt: "Articulated monitor arm above a light wood desk",
    src: "/products/beam-monitor-arm.jpg",
  },
  "dock-valet-tray": {
    alt: "Wooden valet tray holding a watch, glasses, and keys",
    src: "/products/dock-valet-tray.jpg",
  },
  "fold-laptop-stand": {
    alt: "Silver laptop on a white angled stand",
    src: "/products/fold-laptop-stand.jpg",
  },
  "grid-felt-desk-mat": {
    alt: "Charcoal felt desk mat beneath a compact keyboard",
    src: "/products/grid-felt-desk-mat.jpg",
  },
  "halo-desk-lamp": {
    alt: "Chrome adjustable desk lamp in warm light",
    position: "50% 44%",
    src: "/products/halo-desk-lamp.jpg",
  },
  "haven-side-table": {
    alt: "Small wood side table with a ceramic vase",
    position: "50% 58%",
    src: "/products/haven-side-table.jpg",
  },
  "horizon-standing-desk": {
    alt: "White height-adjustable desk against a gray backdrop",
    src: "/products/horizon-standing-desk.jpg",
  },
  "moss-self-watering-planter": {
    alt: "Green plant rooted in a clear water vessel",
    position: "50% 46%",
    src: "/products/moss-self-watering-planter.jpg",
  },
  "slate-writing-desk": {
    alt: "Mid-century wood writing desk on a white background",
    src: "/products/slate-writing-desk.jpg",
  },
  "softline-wool-throw": {
    alt: "Textured wool throw with woven bands and fringe",
    src: "/products/softline-wool-throw.jpg",
  },
  "under-desk-cable-rail": {
    alt: "Black cable-management rail mounted beneath a desk",
    position: "50% 42%",
    src: "/products/under-desk-cable-rail.jpg",
  },
};

function getArtworkKind(slug: string, name: string): string {
  const value = `${slug} ${name}`.toLowerCase();
  if (value.includes("lamp") || value.includes("light")) return "lamp";
  if (value.includes("clock") || value.includes("timer")) return "clock";
  if (value.includes("desk") || value.includes("table")) return "desk";
  if (value.includes("shelf") || value.includes("stand")) return "shelf";
  if (value.includes("tray") || value.includes("catch")) return "tray";
  if (value.includes("vase") || value.includes("vessel")) return "vase";
  if (value.includes("chair") || value.includes("stool")) return "chair";
  return "object";
}

export function ProductArtwork({
  imageUrl,
  name,
  size = "card",
  slug,
}: {
  imageUrl?: string | null;
  name: string;
  size?: ArtworkSize;
  slug: string;
}) {
  const kind = getArtworkKind(slug, name);
  const photo = imageUrl?.startsWith("/")
    ? { alt: name, src: imageUrl }
    : PRODUCT_PHOTOS[slug];
  const sizes =
    size === "mini"
      ? "72px"
      : size === "detail"
        ? "(max-width: 680px) 100vw, 50vw"
        : "(max-width: 680px) 50vw, (max-width: 1100px) 50vw, 33vw";

  return (
    <div
      aria-label={photo ? undefined : `Studio illustration of ${name}`}
      className={`product-artwork artwork-${size}`}
      data-kind={kind}
      data-photo={photo ? "true" : undefined}
      role={photo ? undefined : "img"}
    >
      {photo ? (
        <Image
          alt={photo.alt}
          className="product-photo"
          fill
          loading={size === "detail" ? "eager" : "lazy"}
          sizes={sizes}
          src={photo.src}
          style={{ objectPosition: photo.position }}
        />
      ) : (
        <>
          <span className="art-shadow" />
          <span className="art-piece art-piece-a" />
          <span className="art-piece art-piece-b" />
          <span className="art-piece art-piece-c" />
        </>
      )}
    </div>
  );
}
