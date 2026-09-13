import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.velada.citas',
  appName: 'Nuestras Aventuras',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // Permite apuntar dinámicamente a la URL del backend/web si se especifica
    url: process.env.CAPACITOR_SERVER_URL || undefined,
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
