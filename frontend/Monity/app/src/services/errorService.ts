import { Alert } from 'react-native';

/**
 * Centralized error handling service for consistent error display across the app
 */

export interface ErrorOptions {
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

class ErrorService {
  /**
   * Show a generic error alert
   */
  showError(message: string, options?: ErrorOptions) {
    const { title = 'Erro', onRetry, onDismiss } = options || {};

    const buttons: any[] = [];

    if (onRetry) {
      buttons.push({
        text: 'Tentar Novamente',
        onPress: onRetry,
      });
    }

    buttons.push({
      text: 'OK',
      onPress: onDismiss,
      style: 'cancel',
    });

    Alert.alert(title, message, buttons);
  }

  /**
   * Show a network error alert
   */
  showNetworkError(options?: ErrorOptions) {
    this.showError(
      'Sem conexão com a internet. Verifique sua rede e tente novamente.',
      {
        title: 'Sem Conexão',
        ...options,
      }
    );
  }

  /**
   * Show a validation error alert
   */
  showValidationError(message: string, options?: ErrorOptions) {
    this.showError(message, {
      title: 'Dados Inválidos',
      ...options,
    });
  }

  /**
   * Show a server error alert
   */
  showServerError(options?: ErrorOptions) {
    this.showError(
      'Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.',
      {
        title: 'Erro no Servidor',
        ...options,
      }
    );
  }

  /**
   * Show an authentication error alert
   */
  showAuthError(message?: string, options?: ErrorOptions) {
    this.showError(
      message || 'Erro de autenticação. Por favor, faça login novamente.',
      {
        title: 'Erro de Autenticação',
        ...options,
      }
    );
  }

  /**
   * Show a payment error alert
   */
  showPaymentError(message?: string, options?: ErrorOptions) {
    this.showError(
      message || 'Erro ao processar pagamento. Por favor, tente novamente.',
      {
        title: 'Erro no Pagamento',
        ...options,
      }
    );
  }

  /**
   * Show a data loading error alert
   */
  showLoadingError(resourceName: string = 'dados', options?: ErrorOptions) {
    this.showError(
      `Não foi possível carregar ${resourceName}. Tente novamente.`,
      {
        title: 'Erro ao Carregar',
        ...options,
      }
    );
  }

  /**
   * Show a save error alert
   */
  showSaveError(resourceName: string = 'dados', options?: ErrorOptions) {
    this.showError(
      `Não foi possível salvar ${resourceName}. Tente novamente.`,
      {
        title: 'Erro ao Salvar',
        ...options,
      }
    );
  }

  /**
   * Show a delete error alert
   */
  showDeleteError(resourceName: string = 'item', options?: ErrorOptions) {
    this.showError(
      `Não foi possível excluir ${resourceName}. Tente novamente.`,
      {
        title: 'Erro ao Excluir',
        ...options,
      }
    );
  }

  /**
   * Parse API error response and show appropriate error
   */
  showApiError(error: any, options?: ErrorOptions) {
    if (error.errorCode === 'NETWORK_ERROR') {
      this.showNetworkError(options);
    } else if (error.errorCode === 'UNAUTHORIZED') {
      this.showAuthError(error.error, options);
    } else if (error.errorCode === 'VALIDATION_ERROR') {
      this.showValidationError(error.error, options);
    } else if (error.errorCode === 'SERVER_ERROR') {
      this.showServerError(options);
    } else {
      this.showError(error.error || 'Ocorreu um erro inesperado.', options);
    }
  }
}

// Export singleton instance
export const errorService = new ErrorService();
export default errorService;
