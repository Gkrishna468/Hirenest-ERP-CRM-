export async function safeJson(response: Response): Promise<any> {
  const text = await response.text();
  let data: any = {};
  try {
      data = text ? JSON.parse(text) : {};
  } catch {
      throw new Error(text || "Unknown server error");
  }
  return data;
}
