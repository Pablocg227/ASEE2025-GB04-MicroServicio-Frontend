export const formatDate = (dateString) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const truncateString = (str, num) => {
  if (str.length > num) {
    return str.slice(0, num) + "...";
  }
  return str;
};

export const getUniqueItems = (array) => {
  return [...new Set(array)];
};

export const FILE_BASE_URL = "http://127.0.0.1:8080";

export const fileURL = (rawPath) => {
  if (!rawPath) return null;

  // Ya es absoluta
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
    return rawPath;
  }

  // La API devuelve "/files/…"
  if (rawPath.startsWith("/files/")) {
    return `${FILE_BASE_URL}${rawPath}`;
  }

  // Por si algún día devolviera solo "uploads/img/…"
  return `${FILE_BASE_URL}/files/${rawPath.replace(/^\/+/, "")}`;
};