export async function safeJson(response: Response) {
  const text = await response.text();
  let data = {};
  try {
      data = text ? JSON.parse(text) : {};
  } catch {
      throw new Error(text || "Unknown server error");
  }
  return data;
}
