export function getKakaoRestApiKey(): string | null {
  const key = process.env.KAKAO_REST_API_KEY?.trim()
  return key || null
}

export function kakaoAuthHeader(apiKey: string): HeadersInit {
  return {
    Authorization: `KakaoAK ${apiKey}`,
  }
}

export async function fetchKakaoJson(
  url: string,
  apiKey: string,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const response = await fetch(url, {
    headers: kakaoAuthHeader(apiKey),
  })
  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }
  return { ok: response.ok, status: response.status, data }
}
