function getKakaoRestApiKey() {
  const key = process.env.KAKAO_REST_API_KEY
  if (typeof key !== 'string') return null
  const trimmed = key.trim()
  return trimmed || null
}

function kakaoAuthHeader(apiKey) {
  return {
    Authorization: `KakaoAK ${apiKey}`,
  }
}

async function fetchKakaoJson(url, apiKey) {
  const response = await fetch(url, {
    headers: kakaoAuthHeader(apiKey),
  })
  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }
  return { ok: response.ok, status: response.status, data }
}

module.exports = {
  getKakaoRestApiKey,
  kakaoAuthHeader,
  fetchKakaoJson,
}
