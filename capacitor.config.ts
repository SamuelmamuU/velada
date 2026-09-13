import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.velada.citas',
  appName: 'Nuestras Aventuras',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // Apunta directamente a la versión desplegada en producción en Vercel
    url: process.env.CAPACITOR_SERVER_URL || 'https://velada-flame.vercel.app',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_heart',
      iconColor: '#E07A5F',
      sound: 'beep.wav',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#162738',
    },
  },
};

export default config;
