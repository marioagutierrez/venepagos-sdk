/**
 * Definiciones de tipos para el SDK de VenePagos
 * @version 1.0.0
 */

export interface VenePagosConfig {
  /** API Key de VenePagos (debe comenzar con 'vp_') */
  apiKey: string;
  /** URL base de la API (por defecto: 'https://venepagos.com.ve') */
  baseUrl?: string;
  /** Usar entorno de pruebas */
  sandbox?: boolean;
}

export interface PaymentLinkData {
  /** Título del pago (mínimo 3 caracteres) */
  title: string;
  /** Descripción del pago (opcional) */
  description?: string;
  /** Monto del pago (opcional para monto variable) */
  amount?: number;
  /** Moneda (USD, VES) */
  currency?: 'USD' | 'VES';
  /** Fecha de expiración en formato ISO 8601 */
  expiresAt?: string;
}

export interface PaymentLink {
  /** ID único del payment link */
  id: string;
  /** Título del pago */
  title: string;
  /** Descripción del pago */
  description?: string;
  /** Monto del pago */
  amount?: number;
  /** Moneda */
  currency: string;
  /** URL completa del payment link */
  url: string;
  /** Estado activo del enlace */
  isActive: boolean;
  /** Fecha de expiración */
  expiresAt?: string;
  /** Fecha de creación */
  createdAt: string;
}

export interface PopupOptions {
  /** Ancho de la ventana (por defecto: 600) */
  width?: number;
  /** Alto de la ventana (por defecto: 700) */
  height?: number;
  /** Centrar la ventana (por defecto: true) */
  centered?: boolean;
}

export interface PaymentResult {
  /** Indica si el pago fue exitoso */
  success: boolean;
  /** Referencia del pago */
  reference?: string;
  /** Estado del pago */
  status: 'completed' | 'error' | 'cancelled';
  /** Si la ventana fue cerrada manualmente */
  closedManually?: boolean;
  /** Datos adicionales del pago */
  data?: Record<string, unknown>;
}

export interface PaymentProcess {
  /** Información del payment link creado */
  paymentLink: PaymentLink;
  /** Resultado del proceso de pago */
  paymentResult: PaymentResult;
}

export interface ListOptions {
  /** Cantidad máxima de resultados (por defecto: 50, máximo: 100) */
  limit?: number;
  /** Desplazamiento para paginación */
  offset?: number;
  /** Filtrar por estado activo */
  isActive?: boolean;
}

export interface PaymentLinkList {
  /** Lista de payment links */
  paymentLinks: PaymentLink[];
  /** Información de paginación */
  pagination: {
    /** Total de elementos */
    total: number;
    /** Cantidad de elementos en esta página */
    count: number;
    /** Límite aplicado */
    limit: number;
    /** Offset aplicado */
    offset: number;
    /** Indica si hay más elementos */
    hasMore: boolean;
  };
}

export type PaymentEventType = 'success' | 'error' | 'cancel';

export interface PaymentEventData {
  /** Referencia del pago */
  reference?: string;
  /** Mensaje de error (solo para eventos de error) */
  error?: string;
  /** Datos adicionales del evento */
  [key: string]: unknown;
}

export type PaymentEventCallback = (data: PaymentEventData) => void;

/**
 * Utilidades estáticas del SDK
 */
export interface VenePagosUtils {
  /**
   * Formatea un monto para mostrar
   * @param amount - Monto a formatear
   * @param currency - Moneda
   * @returns Monto formateado
   */
  formatAmount(amount: number, currency?: string): string;

  /**
   * Valida si una fecha de expiración es válida
   * @param expiresAt - Fecha en formato ISO
   * @returns true si es válida y futura
   */
  isValidExpiryDate(expiresAt: string): boolean;

  /**
   * Genera una fecha de expiración
   * @param hours - Horas desde ahora
   * @returns Fecha en formato ISO
   */
  generateExpiryDate(hours?: number): string;
}

/**
 * Clase principal del SDK de VenePagos
 */
export declare class VenePagosSDK {
  /** Utilidades estáticas */
  static utils: VenePagosUtils;

  /**
   * Inicializa el SDK de VenePagos
   * @param config - Configuración del SDK
   */
  constructor(config: VenePagosConfig);

  /**
   * Crea un nuevo enlace de pago
   * @param paymentData - Datos del pago
   * @returns Promise con los datos del payment link creado
   */
  createPaymentLink(paymentData: PaymentLinkData): Promise<PaymentLink>;

  /**
   * Abre una ventana emergente con el enlace de pago
   * @param paymentUrl - URL del payment link
   * @param options - Opciones de la ventana
   * @returns Promise que se resuelve cuando el pago es completado
   */
  openPaymentPopup(paymentUrl: string, options?: PopupOptions): Promise<PaymentResult>;

  /**
   * Crea un payment link y abre inmediatamente la ventana de pago
   * @param paymentData - Datos del pago
   * @param popupOptions - Opciones de la ventana emergente
   * @returns Promise que se resuelve cuando el pago es completado
   */
  createAndOpenPayment(paymentData: PaymentLinkData, popupOptions?: PopupOptions): Promise<PaymentProcess>;

  /**
   * Obtiene información de un payment link existente
   * @param paymentLinkId - ID del payment link
   * @returns Promise con la información del payment link
   */
  getPaymentLink(paymentLinkId: string): Promise<PaymentLink>;

  /**
   * Lista todos los payment links del usuario
   * @param options - Opciones de filtrado y paginación
   * @returns Promise con la lista de payment links y información de paginación
   */
  listPaymentLinks(options?: ListOptions): Promise<PaymentLinkList>;

  /**
   * Configura un listener para eventos de pago
   * @param event - Tipo de evento
   * @param callback - Función a ejecutar cuando ocurra el evento
   */
  on(event: PaymentEventType, callback: PaymentEventCallback): void;

  /**
   * Remueve un listener de eventos
   * @param event - Tipo de evento
   * @param callback - Función a remover
   */
  off(event: PaymentEventType, callback: PaymentEventCallback): void;

  /**
   * Cierra todas las ventanas de pago activas
   */
  closeAllPaymentWindows(): void;

  /**
   * Valida una API key
   * @returns Promise que resuelve true si la API key es válida
   */
  validateApiKey(): Promise<boolean>;

  /**
   * Limpia recursos del SDK
   */
  destroy(): void;
}

export default VenePagosSDK; 