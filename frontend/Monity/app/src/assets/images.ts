import { Image as ExpoImage } from 'expo-image';
import { Image } from 'react-native';

// Imagens pré-carregadas - todas as imagens usadas no app
export const Images = {
  BANNER_MONITY: require('../../../assets/images/BANNER_MONITY.png'),
  MONITY_LOGO: require('../../../assets/images/MONITY_LOGO.png'),
  LOGO_MONITY_512: require('../../../assets/images/LOGO_MONITY_512px512px.png'),
  GOOGLE_LOGO: require('../../../assets/images/google_logo.png'),
} as const;

// Função para pré-carregar todas as imagens usando expo-image
// Para imagens locais (require), o expo-image já faz cache automático,
// mas pré-carregamos para garantir que estejam prontas
export const preloadImages = async (): Promise<void> => {
  try {
    const imagePromises = Object.values(Images).map((imageSource) => {
      const resolvedSource = Image.resolveAssetSource(imageSource);
      if (resolvedSource && resolvedSource.uri) {
        // expo-image usa prefetch para pré-carregar imagens
        return ExpoImage.prefetch(resolvedSource.uri);
      }
      return Promise.resolve();
    });

    await Promise.all(imagePromises);
    console.log('✅ Todas as imagens foram pré-carregadas com sucesso usando expo-image');
  } catch (error) {
    console.warn('⚠️ Erro ao pré-carregar imagens:', error);
    // Não bloquear o app se houver erro no pré-carregamento
    // O expo-image fará cache automático quando as imagens forem renderizadas
  }
};

