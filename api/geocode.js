const { fetchKakaoJson, getKakaoRestApiKey } = require('./_lib/kakao')

function firstCoords(data) {
  const docs = data && data.documents
  if (!Array.isArray(docs) || docs.length === 0) return null
  const doc = docs[0]
  const lat = Number(doc.y)
  const lng = Number(doc.x)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const addressName = String(doc.address_name || doc.place_name || '').trim()
  return { lat, lng, addressName }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  const apiKey = getKakaoRestApiKey()
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: 'SERVER_MISCONFIGURED' })
  }

  const raw = typeof req.query.address === 'string' ? req.query.address : ''
  const address = raw.trim()
  if (!address) {
    return res.status(400).json({ ok: false, error: 'ADDRESS_REQUIRED' })
  }
  if (address.length > 200) {
    return res.status(400).json({ ok: false, error: 'ADDRESS_TOO_LONG' })
  }

  try {
    const addressUrl =
      'https://dapi.kakao.com/v2/local/search/address.json?' +
      new URLSearchParams({ query: address, size: '1' }).toString()
    const addressResult = await fetchKakaoJson(addressUrl, apiKey)
    if (!addressResult.ok) {
      return res.status(502).json({
        ok: false,
        error: 'GEOCODE_UPSTREAM_ERROR',
        upstreamStatus: addressResult.status,
      })
    }

    let coords = firstCoords(addressResult.data)

    if (!coords) {
      const keywordUrl =
        'https://dapi.kakao.com/v2/local/search/keyword.json?' +
        new URLSearchParams({ query: address, size: '1' }).toString()
      const keywordResult = await fetchKakaoJson(keywordUrl, apiKey)
      if (!keywordResult.ok) {
        return res.status(502).json({
          ok: false,
          error: 'GEOCODE_UPSTREAM_ERROR',
          upstreamStatus: keywordResult.status,
        })
      }
      coords = firstCoords(keywordResult.data)
    }

    if (!coords) {
      return res.status(404).json({ ok: false, error: 'ADDRESS_NOT_FOUND' })
    }

    return res.status(200).json({
      ok: true,
      lat: coords.lat,
      lng: coords.lng,
      addressName: coords.addressName || address,
    })
  } catch {
    return res.status(502).json({ ok: false, error: 'GEOCODE_FAILED' })
  }
}
