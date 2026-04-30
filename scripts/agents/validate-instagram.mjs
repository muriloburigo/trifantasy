#!/usr/bin/env node
/**
 * Valida as credenciais do Instagram Graph API sem publicar nada.
 *
 * Usage:
 *   node scripts/agents/validate-instagram.mjs
 *
 * Env vars:
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID
 *   INSTAGRAM_ACCESS_TOKEN
 */

const IG_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
const IG_TOKEN      = process.env.INSTAGRAM_ACCESS_TOKEN

if (!IG_ACCOUNT_ID || !IG_TOKEN) {
  console.error('❌  Missing env vars: INSTAGRAM_BUSINESS_ACCOUNT_ID and/or INSTAGRAM_ACCESS_TOKEN')
  process.exit(1)
}

async function validate() {
  console.log('🔍  Validating Instagram credentials...\n')

  // 1. Check token validity + permissions
  const debugRes = await fetch(
    `https://graph.facebook.com/v20.0/debug_token?input_token=${IG_TOKEN}&access_token=${IG_TOKEN}`
  )
  const debug = await debugRes.json()

  if (debug.error) {
    console.error('❌  Token error:', debug.error.message)
    process.exit(1)
  }

  const info = debug.data ?? {}
  console.log('── Token ────────────────────────────────────────')
  console.log(`  Valid:       ${info.is_valid ? '✅ yes' : '❌ no'}`)
  console.log(`  App ID:      ${info.app_id ?? 'N/A'}`)
  console.log(`  Type:        ${info.type ?? 'N/A'}`)
  console.log(`  Expires:     ${info.expires_at ? new Date(info.expires_at * 1000).toLocaleDateString('pt-BR') : 'never (long-lived)'}`)
  console.log(`  Scopes:      ${(info.scopes ?? []).join(', ') || 'none listed'}`)

  if (!info.is_valid) {
    console.error('\n❌  Token is invalid. Generate a new long-lived token.')
    process.exit(1)
  }

  // Required scopes for posting
  const required = ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement']
  const missing  = required.filter(s => !(info.scopes ?? []).includes(s))
  if (missing.length) {
    console.warn(`\n⚠️   Missing recommended scopes: ${missing.join(', ')}`)
    console.warn('    Posting may fail without these. Re-generate token with full permissions.')
  }

  // 2. Fetch account info
  const accountRes = await fetch(
    `https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}?fields=id,name,username,followers_count,media_count,biography&access_token=${IG_TOKEN}`
  )
  const account = await accountRes.json()

  if (account.error) {
    console.error('\n❌  Account error:', account.error.message)
    console.error('    Check INSTAGRAM_BUSINESS_ACCOUNT_ID — it must be the numeric Business Account ID, not username.')
    process.exit(1)
  }

  console.log('\n── Instagram Account ────────────────────────────')
  console.log(`  ID:          ${account.id}`)
  console.log(`  Username:    @${account.username ?? 'N/A'}`)
  console.log(`  Name:        ${account.name ?? 'N/A'}`)
  console.log(`  Followers:   ${account.followers_count?.toLocaleString('pt-BR') ?? 'N/A'}`)
  console.log(`  Posts:       ${account.media_count ?? 'N/A'}`)

  // 3. Check publishing limit
  const limitRes = await fetch(
    `https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}/content_publishing_limit?fields=config,quota_usage&access_token=${IG_TOKEN}`
  )
  const limit = await limitRes.json()

  if (!limit.error && limit.data?.[0]) {
    const l = limit.data[0]
    console.log('\n── Publishing Limit (24h) ───────────────────────')
    console.log(`  Used:        ${l.quota_usage ?? 0} / ${l.config?.quota_total ?? 50}`)
    const remaining = (l.config?.quota_total ?? 50) - (l.quota_usage ?? 0)
    console.log(`  Remaining:   ${remaining} posts today`)
    if (remaining < 5) console.warn('  ⚠️   Low posting quota — approaching daily limit')
  }

  // 4. Fetch last post to confirm read access works
  const mediaRes = await fetch(
    `https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}/media?fields=id,timestamp,media_type,permalink&limit=1&access_token=${IG_TOKEN}`
  )
  const media = await mediaRes.json()

  if (!media.error && media.data?.[0]) {
    const last = media.data[0]
    console.log('\n── Last Post ────────────────────────────────────')
    console.log(`  ID:          ${last.id}`)
    console.log(`  Type:        ${last.media_type}`)
    console.log(`  Date:        ${new Date(last.timestamp).toLocaleDateString('pt-BR')}`)
    console.log(`  URL:         ${last.permalink}`)
  }

  console.log('\n✅  All checks passed — Instagram credentials are valid and ready to use.')
  console.log('\n📋  Next step: run with a real action')
  console.log('    node scripts/agents/marketing-agent.mjs --action=post-upcoming-race --dry-run')
}

validate().catch(err => {
  console.error('❌  Unexpected error:', err.message)
  process.exit(1)
})
