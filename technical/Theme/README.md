# Theme

Technical presentation layer. Light/dark/automatic luminosity remains independent of the visual scene.

## Appearance contract — #216

Three scenes: forest (default), notebook, library. Identical routes, permissions and controls for every scene, adults and children. Store the selected scene per profile on the current device, with a separate device key used before profile selection. A new profile defaults to forest; it must never inherit another profile’s scene. Unknown values and unavailable storage fall back safely. A storage failure does not prevent applying the choice for this session.

The root html data-appearance attribute drives shared scene tokens and page styling. Profile menu exposes three accessible preview buttons; choosing applies immediately. Splash uses the same scene, keeps the mascot/title visible in portrait and landscape, and preserves startup update logic. Existing light/dark/automatic settings, learning font, text scale and reduced-motion/foliage pause remain effective. Decorative images carry no accessible content.

Weather, seasonal and holiday scenes are deferred. No remote weather request or location permission is introduced. No new dependency. Themes remain on dev for local visual review before a grouped production release.
