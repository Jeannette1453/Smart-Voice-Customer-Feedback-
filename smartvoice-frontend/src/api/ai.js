import aiApi from "./aiAxios";

export async function analyzeMessage({ message, category, subCategory }) {
  const res = await aiApi.post("/analyze", {
    message,
    category: category || null,
    subCategory: subCategory || null,
  });
  return res.data;
}