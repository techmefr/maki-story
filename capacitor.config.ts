import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
    appId: 'app.tantara.mobile',
    appName: 'Maki Story',
    webDir: '.output/public',
    plugins: { CapacitorHttp: { enabled: true } },
}

export default config
