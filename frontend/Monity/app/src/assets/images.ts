// TODO: Descomentar quando for fazer build (não funciona no Expo Go)
// import FastImage from 'react-native-fast-image';
import { Image } from 'react-native';

// Imagens pré-carregadas - todas as imagens usadas no app
export const Images = {
  BANNER_MONITY: require('../../../assets/images/BANNER_MONITY.png'),
  MONITY_LOGO: require('../../../assets/images/MONITY_LOGO.png'),
  LOGO_MONITY_512: require('../../../assets/images/LOGO_MONITY_512px512px.png'),
  GOOGLE_LOGO: require('../../../assets/images/google_logo.png'),
} as const;

// TODO: Descomentar quando for fazer build (não funciona no Expo Go)
// Função para pré-carregar todas as imagens usando FastImage
// Para imagens locais (require), o FastImage já faz cache automático,
// mas pré-carregamos para garantir que estejam prontas
// export const preloadImages = async (): Promise<void> => {
//   try {
//     const imagePromises = Object.values(Images).map((imageSource) => {
//       const resolvedSource = Image.resolveAssetSource(imageSource);
//       if (resolvedSource && resolvedSource.uri) {
//         // FastImage.preload aceita um array de objetos com uri
//         return FastImage.preload([{ uri: resolvedSource.uri, priority: FastImage.priority.high }]);
//       }
//       return Promise.resolve();
//     });
//     
//     await Promise.all(imagePromises);
//     console.log('✅ Todas as imagens foram pré-carregadas com sucesso usando FastImage');
//   } catch (error) {
//     console.warn('⚠️ Erro ao pré-carregar imagens:', error);
//     // Não bloquear o app se houver erro no pré-carregamento
//     // O FastImage fará cache automático quando as imagens forem renderizadas
//   }
// };

// Função vazia para não quebrar o código no Expo Go
export const preloadImages = async (): Promise<void> => {
  // Função vazia - FastImage não funciona no Expo Go
  return Promise.resolve();
};

