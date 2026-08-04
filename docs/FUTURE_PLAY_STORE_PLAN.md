# Future Play Store Plan

Do not build the mobile app yet. Keep this web MVP as the fastest product-learning surface.

Recommended future stack:

- React Native Expo
- Same FastAPI backend
- Same Supabase database
- Same OpenAI transcription and analysis services

Future Android features:

- Push reminders for daily check-ins
- Offline check-in draft
- Native voice recording
- Android App Bundle build
- Play Store launch
- Privacy policy URL
- Data Safety form

Migration path:

1. Extract shared TypeScript API types into a package or generated OpenAPI client.
2. Reuse Supabase Auth in Expo with secure token storage.
3. Point the mobile app at the existing FastAPI backend.
4. Use Expo audio APIs for native recording and upload temporary audio to `/check-ins/voice`.
5. Publish a stable privacy policy URL before Play Store review.
