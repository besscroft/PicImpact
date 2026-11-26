export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`);
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`接口 ${path} 返回了非 JSON 响应（Content-Type: ${response.headers.get("content-type") ?? "未知"}）`);
  }
}
