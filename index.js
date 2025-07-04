/**
 * SDK oficial de VenePagos para integrar pagos en aplicaciones web
 * @version 1.0.0
 * @author VenePagos
 */

class VenePagosSDK {
  /**
   * Inicializa el SDK de VenePagos
   * @param {Object} config - Configuración del SDK
   * @param {string} config.apiKey - API Key de VenePagos (debe comenzar con 'vp_')
   * @param {string} [config.baseUrl='https://venepagos.com.ve'] - URL base de la API
   * @param {boolean} [config.sandbox=false] - Usar entorno de pruebas
   */
  constructor(config) {
    if (!config || !config.apiKey) {
      throw new Error('API Key es requerido para inicializar VenePagos SDK');
    }

    if (!config.apiKey.startsWith('vp_')) {
      throw new Error('API Key debe comenzar con "vp_"');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://venepagos.com.ve';
    this.sandbox = config.sandbox || false;
    
    // Estado interno para manejar ventanas de pago
    this.activePaymentWindows = new Map();
    this.eventListeners = [];
    
    // Configurar listener para mensajes de ventanas emergentes
    this._setupMessageListener();
  }

  /**
   * Crea un nuevo enlace de pago
   * @param {Object} paymentData - Datos del pago
   * @param {string} paymentData.title - Título del pago (mínimo 3 caracteres)
   * @param {string} [paymentData.description] - Descripción del pago
   * @param {number} [paymentData.amount] - Monto del pago (opcional para monto variable)
   * @param {string} [paymentData.currency='USD'] - Moneda (USD, VES)
   * @param {string} [paymentData.expiresAt] - Fecha de expiración (ISO 8601)
   * @returns {Promise<Object>} - Datos del payment link creado
   */
  async createPaymentLink(paymentData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/public/payment-links/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          title: paymentData.title,
          description: paymentData.description,
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD',
          expiresAt: paymentData.expiresAt
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Error HTTP ${response.status}`);
      }

      return result.data;
    } catch (error) {
      throw new Error(`Error al crear payment link: ${error.message}`);
    }
  }

  /**
   * Abre una ventana emergente con el enlace de pago
   * @param {string} paymentUrl - URL del payment link
   * @param {Object} [options] - Opciones de la ventana
   * @param {number} [options.width=600] - Ancho de la ventana
   * @param {number} [options.height=700] - Alto de la ventana
   * @param {boolean} [options.centered=true] - Centrar la ventana
   * @returns {Promise<Object>} - Promise que se resuelve cuando el pago es completado
   */
  async openPaymentPopup(paymentUrl, options = {}) {
    return new Promise((resolve, reject) => {
      const windowOptions = {
        width: options.width || 600,
        height: options.height || 700,
        centered: options.centered !== false
      };

      // Calcular posición centrada
      let left = 0;
      let top = 0;
      
      if (windowOptions.centered) {
        left = Math.round((window.screen.width - windowOptions.width) / 2);
        top = Math.round((window.screen.height - windowOptions.height) / 2);
      }

      const windowFeatures = [
        `width=${windowOptions.width}`,
        `height=${windowOptions.height}`,
        `left=${left}`,
        `top=${top}`,
        'scrollbars=yes',
        'resizable=yes',
        'status=no',
        'toolbar=no',
        'menubar=no',
        'location=no'
      ].join(',');

      // Abrir ventana emergente
      const popup = window.open(paymentUrl, 'venepagos_payment', windowFeatures);

      if (!popup) {
        reject(new Error('No se pudo abrir la ventana emergente. Verifica que las ventanas emergentes estén habilitadas.'));
        return;
      }

      // Generar ID único para esta ventana de pago
      const paymentId = this._generatePaymentId();
      
      // Registrar la ventana activa
      this.activePaymentWindows.set(paymentId, {
        window: popup,
        resolve,
        reject,
        url: paymentUrl,
        timestamp: Date.now()
      });

      // Monitorear si la ventana es cerrada manualmente
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          
          const paymentData = this.activePaymentWindows.get(paymentId);
          if (paymentData) {
            this.activePaymentWindows.delete(paymentId);
            
            // Verificar si hay alguna referencia de pago guardada antes de rechazar
            const savedReference = localStorage.getItem('lastPaymentReference');
            if (savedReference) {
              localStorage.removeItem('lastPaymentReference');
              resolve({
                success: true,
                reference: savedReference,
                status: 'completed',
                closedManually: true
              });
            } else {
              reject(new Error('Ventana de pago cerrada por el usuario'));
            }
          }
        }
      }, 1000);

      // Timeout de seguridad (30 minutos)
      setTimeout(() => {
        if (this.activePaymentWindows.has(paymentId)) {
          clearInterval(checkClosed);
          popup.close();
          this.activePaymentWindows.delete(paymentId);
          reject(new Error('Timeout: El pago excedió el tiempo límite'));
        }
      }, 30 * 60 * 1000);
    });
  }

  /**
   * Crea un payment link y abre inmediatamente la ventana de pago
   * @param {Object} paymentData - Datos del pago
   * @param {Object} [popupOptions] - Opciones de la ventana emergente
   * @returns {Promise<Object>} - Promise que se resuelve cuando el pago es completado
   */
  async createAndOpenPayment(paymentData, popupOptions = {}) {
    try {
      // Crear el payment link
      const paymentLink = await this.createPaymentLink(paymentData);
      
      // Abrir la ventana de pago
      const paymentResult = await this.openPaymentPopup(paymentLink.url, popupOptions);
      
      return {
        paymentLink,
        paymentResult
      };
    } catch (error) {
      throw new Error(`Error en el proceso de pago: ${error.message}`);
    }
  }

  /**
   * Obtiene información de un payment link existente
   * @param {string} paymentLinkId - ID del payment link
   * @returns {Promise<Object>} - Información del payment link
   */
  async getPaymentLink(paymentLinkId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/payment-links/${paymentLinkId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Error HTTP ${response.status}`);
      }

      return result.data;
    } catch (error) {
      throw new Error(`Error al obtener payment link: ${error.message}`);
    }
  }

  /**
   * Lista todos los payment links del usuario
   * @param {Object} [options] - Opciones de filtrado
   * @param {number} [options.limit=50] - Cantidad máxima de resultados
   * @param {number} [options.offset=0] - Desplazamiento para paginación
   * @param {boolean} [options.isActive] - Filtrar por estado activo
   * @returns {Promise<Object>} - Lista de payment links con información de paginación
   */
  async listPaymentLinks(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.isActive !== undefined) params.append('isActive', options.isActive.toString());

      const url = `${this.baseUrl}/api/public/payment-links/list${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Error HTTP ${response.status}`);
      }

      return result.data;
    } catch (error) {
      throw new Error(`Error al listar payment links: ${error.message}`);
    }
  }

  /**
   * Configura un listener para eventos de pago
   * @param {string} event - Tipo de evento ('success', 'error', 'cancel')
   * @param {Function} callback - Función a ejecutar cuando ocurra el evento
   */
  on(event, callback) {
    if (typeof callback !== 'function') {
      throw new Error('El callback debe ser una función');
    }

    this.eventListeners.push({ event, callback });
  }

  /**
   * Remueve un listener de eventos
   * @param {string} event - Tipo de evento
   * @param {Function} callback - Función a remover
   */
  off(event, callback) {
    this.eventListeners = this.eventListeners.filter(
      listener => !(listener.event === event && listener.callback === callback)
    );
  }

  /**
   * Cierra todas las ventanas de pago activas
   */
  closeAllPaymentWindows() {
    this.activePaymentWindows.forEach((paymentData) => {
      if (paymentData.window && !paymentData.window.closed) {
        paymentData.window.close();
      }
    });
    this.activePaymentWindows.clear();
  }

  /**
   * Valida una API key
   * @returns {Promise<boolean>} - true si la API key es válida
   */
  async validateApiKey() {
    try {
      const response = await fetch(`${this.baseUrl}/api/public/test-api-key`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  // Métodos privados
  _setupMessageListener() {
    const messageHandler = (event) => {
      // Verificar que el mensaje venga del dominio correcto
      if (!event.origin.includes('venepagos')) return;

      const { type, data } = event.data || {};

      // Manejar diferentes tipos de mensajes
      switch (type) {
        case 'PAYMENT_SUCCESS':
          this._handlePaymentSuccess(data);
          break;
        case 'PAYMENT_ERROR':
          this._handlePaymentError(data);
          break;
        case 'PAYMENT_CANCEL':
          this._handlePaymentCancel(data);
          break;
      }
    };

    window.addEventListener('message', messageHandler);
    
    // Guardar referencia para poder remover el listener después
    this._messageHandler = messageHandler;
  }

  _handlePaymentSuccess(data) {
    // Emitir evento de éxito
    this._emitEvent('success', data);
    
    // Resolver promesas de ventanas activas si es necesario
    this.activePaymentWindows.forEach((paymentData, paymentId) => {
      if (paymentData.resolve) {
        paymentData.resolve({
          success: true,
          reference: data.reference,
          status: 'completed',
          data
        });
        this.activePaymentWindows.delete(paymentId);
      }
    });
  }

  _handlePaymentError(data) {
    this._emitEvent('error', data);
    
    this.activePaymentWindows.forEach((paymentData, paymentId) => {
      if (paymentData.reject) {
        paymentData.reject(new Error(data.error || 'Error en el pago'));
        this.activePaymentWindows.delete(paymentId);
      }
    });
  }

  _handlePaymentCancel(data) {
    this._emitEvent('cancel', data);
    
    this.activePaymentWindows.forEach((paymentData, paymentId) => {
      if (paymentData.reject) {
        paymentData.reject(new Error('Pago cancelado por el usuario'));
        this.activePaymentWindows.delete(paymentId);
      }
    });
  }

  _emitEvent(event, data) {
    this.eventListeners
      .filter(listener => listener.event === event)
      .forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error('Error en callback de evento:', error);
        }
      });
  }

  _generatePaymentId() {
    return `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Limpia recursos del SDK
   */
  destroy() {
    // Cerrar todas las ventanas activas
    this.closeAllPaymentWindows();
    
    // Remover event listeners
    if (this._messageHandler) {
      window.removeEventListener('message', this._messageHandler);
    }
    
    // Limpiar referencias
    this.eventListeners = [];
    this.activePaymentWindows.clear();
  }
}

// Funciones de utilidad estáticas
VenePagosSDK.utils = {
  /**
   * Formatea un monto para mostrar
   * @param {number} amount - Monto
   * @param {string} currency - Moneda
   * @returns {string} - Monto formateado
   */
  formatAmount(amount, currency = 'USD') {
    if (typeof amount !== 'number') return '0.00';
    
    const formatter = new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
  },

  /**
   * Valida si una fecha de expiración es válida
   * @param {string} expiresAt - Fecha en formato ISO
   * @returns {boolean} - true si es válida y futura
   */
  isValidExpiryDate(expiresAt) {
    if (!expiresAt) return false;
    const date = new Date(expiresAt);
    return !isNaN(date.getTime()) && date > new Date();
  },

  /**
   * Genera una fecha de expiración
   * @param {number} hours - Horas desde ahora
   * @returns {string} - Fecha en formato ISO
   */
  generateExpiryDate(hours = 24) {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date.toISOString();
  }
};

// Exportar para diferentes entornos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VenePagosSDK;
} else if (typeof window !== 'undefined') {
  window.VenePagosSDK = VenePagosSDK;
}
