const { getKakaoRestApiKey } = require('./_lib/kakao')

/**
 * Safe deployment diagnostic — never returns the API key value.
 * GET /api/diag
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  return res.status(200).json({
    ok: true,
    kakaoConfigured: Boolean(getKakaoRestApiKey()),
    nodeVersion: process.version,
  })
}
