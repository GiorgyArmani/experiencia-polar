// Toma app.json y le aplica el dominio del servidor, para cambiarlo sin tocar nada más:
//   EXPO_PUBLIC_API_URL=https://experienciapolar.aulaciete.com npx eas-cli build ...
// De ahí salen la URL de la API y los universal/app links (el QR abre la app directo).
import type { ConfigContext, ExpoConfig } from 'expo/config';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://experiencia-polar.vercel.app').replace(/\/$/, '');
const HOST = new URL(API_URL).host;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  ios: { ...config.ios, associatedDomains: [`applinks:${HOST}`] },
  android: {
    ...config.android,
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: HOST, pathPrefix: '/q/' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  extra: { ...config.extra, apiUrl: API_URL },
});
