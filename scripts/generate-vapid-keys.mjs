import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()
console.log('\n=== VAPID Keys ===')
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey)
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey)
console.log('VAPID_EMAIL=mailto:contato@trixer.app')
console.log('\nAdd these 3 env vars to Vercel and also to NEXT_PUBLIC_VAPID_PUBLIC_KEY:\n')
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + keys.publicKey)
