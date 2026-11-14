// Request a high-density, square avatar from Cloudinary instead of stretching
// a small delivered thumbnail in the UI. Non-Cloudinary URLs are preserved.
export const getProfileImageUrl = (url, size = 256) => {
  const source = String(url || "").trim();
  if (!source || !source.includes("res.cloudinary.com/")) return source;

  const transform = `f_auto,q_auto:best,c_fill,g_face,w_${size},h_${size},dpr_2`;
  return source.includes("/upload/")
    ? source.replace("/upload/", `/upload/${transform}/`)
    : source;
};
