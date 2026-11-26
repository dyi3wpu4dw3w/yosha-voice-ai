# YOSHA VOICE AI

AI text-to-speech web app and Android application powered by the ElevenLabs API.

## Architecture

- The web UI is bundled locally inside the Android app with Capacitor.
- Audio generation and voice-list requests go to the existing Node/Express service on Render.
- The ElevenLabs API key remains on the server as `ELEVENLABS_API_KEY`; never add it to the Android app or repository.
- The Android app uses HTTPS to call `https://yosha-voice-ai.onrender.com`.
- The privacy policy is available at `/privacy.html` in the hosted website and inside the bundled app.

If the Render service URL changes, update `API_BASE` in `public/index.html` and the allowed-origin list in `server.js`.

## Run the web service

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Set `ELEVENLABS_API_KEY` in the server environment.
4. Run `npm start`.

## Build Android locally

Requirements: Node.js 22, Java 21, Android SDK, and Python 3 with Pillow.

```bash
npm install
python -m pip install Pillow
python scripts/generate_brand_assets.py
npx cap add android
npx capacitor-assets generate --android
npx cap sync android
cd android
./gradlew assembleDebug bundleRelease
```

The debug APK is written to `android/app/build/outputs/apk/debug/`.
The release Android App Bundle is written to `android/app/build/outputs/bundle/release/`.

## Automated Android builds

GitHub Actions builds a debug APK and a release AAB on pushes to `main` or `android-google-play`, and on pull requests targeting `main`. Download the `yosha-voice-ai-android` artifact from the workflow run.

The workflow signs the release AAB only when all four GitHub Actions repository secrets are configured:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded upload keystore file.
- `ANDROID_KEY_ALIAS`: key alias.
- `ANDROID_KEYSTORE_PASSWORD`: keystore password.
- `ANDROID_KEY_PASSWORD`: key password.

Create a dedicated upload key and store its keystore and passwords securely. Do not commit the keystore or passwords. For example, encode the keystore locally with `base64 -w 0 upload-keystore.jks` and add the output as the `ANDROID_KEYSTORE_BASE64` secret. Keep a secure backup of the keystore.

## Google Play release checklist

A successful CI build is not the same as a published Play Store app. Before submission:

1. Configure all four signing secrets and confirm the workflow produces a signed `.aab`.
2. Create the Google Play Console developer account and app entry.
3. Upload the signed AAB to an internal testing track first.
4. Complete the store listing: app name, short and full descriptions, screenshots, 512×512 app icon, feature graphic, and support contact.
5. Publish the privacy policy URL: `https://yosha-voice-ai.onrender.com/privacy.html`. Confirm the live page is reachable and reflects the final data practices.
6. Complete the Data safety form, content rating, target audience, ads declaration, and app access questions truthfully.
7. Test generation, voice previews, audio playback/download, network failures, Arabic text, and app lifecycle on real Android devices.
8. Review the latest Play target API and other policy requirements in Play Console before production rollout.

## Important release notes

- The current application does not implement user accounts, subscriptions, or cloud-synced generation history.
- Recent generation history is stored locally on the device. Its current object URLs are temporary browser URLs and are not guaranteed to remain downloadable after the app is closed.
- Text entered by users is transmitted to the YOSHA server and then to ElevenLabs for synthesis. Keep the privacy policy and Play Data safety declaration aligned with the actual service configuration.
- The current server has basic request validation but should receive production abuse controls, monitoring, and privacy/contact details before a public launch.
- The Android package ID is `com.yosha.voiceai`. Once the app is published, changing this ID creates a different Play Store app.
