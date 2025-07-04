# SDK de VenePagos

<div align="center">
  <img src="https://venepagos.com.ve/logo_hor.png" alt="VenePagos" width="300">

  **SDK oficial de VenePagos para integrar pagos en bolivares automatizado en aplicaciones web**

  [![npm version](https://badge.fury.io/js/@venepagos%2Fpayment-sdk.svg)](https://badge.fury.io/js/@venepagos%2Fpayment-sdk)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## 🚀 Características

- ✅ **Fácil integración**: Implementa pagos en minutos
- 🔒 **Seguro**: Todas las transacciones son procesadas de forma segura
- 💰 **Múltiples monedas**: Soporte para USD y VES
- 🖼️ **Ventanas emergentes**: Experiencia de usuario fluida con popups
- 📱 **Responsive**: Funciona en desktop y móvil
- 🎯 **TypeScript**: Soporte completo con tipado
- 🔄 **Eventos en tiempo real**: Detecta el estado del pago automáticamente

## 📦 Instalación

```bash
npm install @venepagos/payment-sdk
```

O usando yarn:

```bash
yarn add @venepagos/payment-sdk
```

Para uso directo en el navegador:

```html
<script src="https://unpkg.com/@venepagos/payment-sdk@latest/index.js"></script>
```

## 🔧 Configuración inicial

### 1. Obtener API Key

Primero necesitas obtener tu API Key desde el panel de VenePagos:

1. Inicia sesión en [VenePagos](https://venepagos.com.ve)
2. Ve a **Perfil → API Keys**
3. Crea una nueva API Key
4. Copia la clave (debe comenzar con `vp_`)

### 2. Inicializar el SDK

```javascript
import VenePagosSDK from '@venepagos/payment-sdk';

// Inicializar el SDK
const venepagos = new VenePagosSDK({
  apiKey: 'vp_tu_api_key_aqui',
  baseUrl: 'https://venepagos.com.ve', // Opcional
  sandbox: false // Opcional: true para pruebas
});
```

Para JavaScript sin ES modules:

```javascript
const VenePagosSDK = require('@venepagos/payment-sdk');

const venepagos = new VenePagosSDK({
  apiKey: 'vp_tu_api_key_aqui'
});
```

En el navegador:

```html
<script>
const venepagos = new VenePagosSDK({
  apiKey: 'vp_tu_api_key_aqui'
});
</script>
```

## 🎯 Ejemplos de uso

### Ejemplo básico - Crear y abrir pago

```javascript
async function procesarPago() {
  try {
    const resultado = await venepagos.createAndOpenPayment({
      title: 'Compra de productos',
      description: 'Pago por productos del carrito',
      amount: 25.99,
      currency: 'USD',
      expiresAt: VenePagosSDK.utils.generateExpiryDate(24) // Expira en 24 horas
    });

    console.log('¡Pago exitoso!', resultado.paymentResult.reference);
  } catch (error) {
    console.error('Error en el pago:', error.message);
  }
}
```

### Ejemplo avanzado - Con eventos

```javascript
// Configurar listeners de eventos
venepagos.on('success', (data) => {
  console.log('Pago exitoso:', data.reference);
  // Actualizar la interfaz, redirigir, etc.
});

venepagos.on('error', (data) => {
  console.error('Error en el pago:', data.error);
  // Mostrar mensaje de error al usuario
});

venepagos.on('cancel', (data) => {
  console.log('Pago cancelado por el usuario');
});

// Crear payment link
const paymentLink = await venepagos.createPaymentLink({
  title: 'Suscripción Premium',
  amount: 9.99,
  currency: 'USD'
});

// Abrir ventana de pago con opciones personalizadas
const resultado = await venepagos.openPaymentPopup(paymentLink.url, {
  width: 800,
  height: 600,
  centered: true
});
```

### Ejemplo React

```jsx
import React, { useState } from 'react';
import VenePagosSDK from '@venepagos/payment-sdk';

const venepagos = new VenePagosSDK({
  apiKey: process.env.REACT_APP_VENEPAGOS_API_KEY
});

function PagoComponent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePago = async () => {
    setLoading(true);
    try {
      const resultado = await venepagos.createAndOpenPayment({
        title: 'Producto Premium',
        amount: 49.99,
        currency: 'USD'
      });
    
      setResult(resultado.paymentResult);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handlePago} disabled={loading}>
        {loading ? 'Procesando...' : 'Pagar $49.99'}
      </button>
    
      {result && result.success && (
        <div className="success">
          ¡Pago exitoso! Referencia: {result.reference}
        </div>
      )}
    </div>
  );
}
```

### Ejemplo con monto variable

```javascript
// Para pagos donde el usuario define el monto
const paymentLink = await venepagos.createPaymentLink({
  title: 'Donación',
  description: 'Apoya nuestro proyecto',
  // No especificar amount para monto variable
  currency: 'USD'
});

console.log('URL de pago:', paymentLink.url);
```

## 📚 Referencia de API

### Constructor

```typescript
new VenePagosSDK(config: VenePagosConfig)
```

**Parámetros:**

- `config.apiKey` (string): Tu API Key de VenePagos
- `config.baseUrl` (string, opcional): URL base de la API
- `config.sandbox` (boolean, opcional): Modo de pruebas

### Métodos principales

#### `createPaymentLink(paymentData)`

Crea un nuevo enlace de pago.

```typescript
createPaymentLink(paymentData: PaymentLinkData): Promise<PaymentLink>
```

**Parámetros:**

```typescript
interface PaymentLinkData {
  title: string;              // Título del pago (mín. 3 caracteres)
  description?: string;       // Descripción opcional
  amount?: number;           // Monto (opcional para monto variable)
  currency?: 'USD' | 'VES';  // Moneda
  expiresAt?: string;        // Fecha de expiración (ISO 8601)
}
```

**Retorna:**

```typescript
interface PaymentLink {
  id: string;
  title: string;
  description?: string;
  amount?: number;
  currency: string;
  url: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}
```

#### `openPaymentPopup(paymentUrl, options)`

Abre una ventana emergente con el enlace de pago.

```typescript
openPaymentPopup(paymentUrl: string, options?: PopupOptions): Promise<PaymentResult>
```

**Opciones:**

```typescript
interface PopupOptions {
  width?: number;    // Ancho (por defecto: 600)
  height?: number;   // Alto (por defecto: 700)
  centered?: boolean; // Centrar (por defecto: true)
}
```

#### `createAndOpenPayment(paymentData, popupOptions)`

Crea un payment link y abre inmediatamente la ventana de pago.

```typescript
createAndOpenPayment(
  paymentData: PaymentLinkData, 
  popupOptions?: PopupOptions
): Promise<PaymentProcess>
```

#### `listPaymentLinks(options)`

Lista todos tus payment links.

```typescript
listPaymentLinks(options?: ListOptions): Promise<PaymentLinkList>
```

**Opciones:**

```typescript
interface ListOptions {
  limit?: number;     // Máximo 100
  offset?: number;    // Para paginación
  isActive?: boolean; // Filtrar por estado
}
```

#### `getPaymentLink(paymentLinkId)`

Obtiene información de un payment link específico.

```typescript
getPaymentLink(paymentLinkId: string): Promise<PaymentLink>
```

### Eventos

#### `on(event, callback)`

Configura un listener para eventos de pago.

```typescript
venepagos.on('success', (data) => {
  console.log('Pago exitoso:', data.reference);
});

venepagos.on('error', (data) => {
  console.error('Error:', data.error);
});

venepagos.on('cancel', (data) => {
  console.log('Pago cancelado');
});
```

#### `off(event, callback)`

Remueve un listener de eventos.

### Utilidades

#### `VenePagosSDK.utils.formatAmount(amount, currency)`

Formatea un monto para mostrar.

```javascript
const formatted = VenePagosSDK.utils.formatAmount(25.99, 'USD');
console.log(formatted); // "$25.99"
```

#### `VenePagosSDK.utils.generateExpiryDate(hours)`

Genera una fecha de expiración.

```javascript
const expiry = VenePagosSDK.utils.generateExpiryDate(48); // 48 horas
```

#### `VenePagosSDK.utils.isValidExpiryDate(expiresAt)`

Valida si una fecha de expiración es válida.

```javascript
const isValid = VenePagosSDK.utils.isValidExpiryDate('2024-12-31T23:59:59Z');
```

## 🔐 Seguridad

- **Nunca expongas tu API Key** en el código cliente en producción
- Usa variables de entorno para almacenar credenciales
- Para aplicaciones del lado del cliente, considera usar un backend proxy
- Las API Keys deben comenzar con `vp_`

### Ejemplo seguro para React

```javascript
// .env.local
REACT_APP_VENEPAGOS_API_KEY=vp_tu_api_key

// Componente
const venepagos = new VenePagosSDK({
  apiKey: process.env.REACT_APP_VENEPAGOS_API_KEY
});
```

## 🎨 Personalización de UI

### Estilos de la ventana emergente

La ventana de pago es responsiva y se adapta automáticamente. Puedes controlar las dimensiones:

```javascript
const resultado = await venepagos.openPaymentPopup(url, {
  width: 800,    // Más ancho para desktop
  height: 900,   // Más alto
  centered: true // Centrado en pantalla
});
```

### Detección de cierre de ventana

```javascript
try {
  const resultado = await venepagos.openPaymentPopup(url);
  // Pago completado exitosamente
} catch (error) {
  if (error.message.includes('cerrada por el usuario')) {
    console.log('El usuario cerró la ventana');
  }
}
```

## 🔍 Debugging y manejo de errores

### Validación de API Key

```javascript
const isValid = await venepagos.validateApiKey();
if (!isValid) {
  console.error('API Key inválida');
}
```

### Errores comunes

| Error                               | Causa                        | Solución                                          |
| ----------------------------------- | ---------------------------- | -------------------------------------------------- |
| `API Key es requerido`            | No se proporcionó API Key   | Agregar API Key en la configuración               |
| `API Key debe comenzar con "vp_"` | Formato incorrecto           | Verificar que la API Key tenga el formato correcto |
| `Error HTTP 401`                  | API Key inválida o expirada | Generar nueva API Key                              |
| `Error HTTP 400`                  | Datos inválidos             | Verificar los datos del payment link               |
| `Ventana emergente bloqueada`     | Bloqueador de popups activo  | Instruir al usuario para permitir popups           |

### Logging detallado

```javascript
// Habilitar logging en desarrollo
venepagos.on('success', console.log);
venepagos.on('error', console.error);
venepagos.on('cancel', console.warn);
```

## 🌐 Compatibilidad

- **Navegadores**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Node.js**: 14.0+
- **React**: 16.8+
- **Vue**: 2.6+ / 3.0+
- **Angular**: 9+

## 📱 Responsive

El SDK y las páginas de pago son completamente responsivas:

- **Desktop**: Ventana emergente optimizada
- **Mobile**: Redirección a página de pago adaptada
- **Tablet**: Experiencia híbrida optimizada

## 🚀 Mejores prácticas

### 1. Manejo de estados

```javascript
class PaymentManager {
  constructor() {
    this.venepagos = new VenePagosSDK({ apiKey: 'tu_api_key' });
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.venepagos.on('success', this.onPaymentSuccess.bind(this));
    this.venepagos.on('error', this.onPaymentError.bind(this));
  }

  async processPayment(amount) {
    try {
      return await this.venepagos.createAndOpenPayment({
        title: 'Compra',
        amount,
        currency: 'USD'
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  cleanup() {
    this.venepagos.destroy();
  }
}
```

### 2. Caché de payment links

```javascript
const cache = new Map();

async function getOrCreatePaymentLink(productId, amount) {
  if (cache.has(productId)) {
    return cache.get(productId);
  }

  const paymentLink = await venepagos.createPaymentLink({
    title: `Producto ${productId}`,
    amount,
    currency: 'USD'
  });

  cache.set(productId, paymentLink);
  return paymentLink;
}
```

### 3. Reintentos automáticos

```javascript
async function createPaymentWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await venepagos.createPaymentLink(data);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * i));
    }
  }
}
```

## 🔄 Migración

### Desde otras pasarelas

Si estás migrando desde otra pasarela de pagos:

```javascript
// Antes (genérico)
function openPayment(amount) {
  window.open(`https://otras-pasarela.com/pay?amount=${amount}`);
}

// Después (VenePagos)
async function openPayment(amount) {
  try {
    const resultado = await venepagos.createAndOpenPayment({
      title: 'Pago',
      amount,
      currency: 'USD'
    });
    console.log('Pago exitoso:', resultado.paymentResult.reference);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## 🤝 Soporte

- **Documentación**: [https://docs.venepagos.com.ve](https://venepagos.com.ve)
- **Issues**: [GitHub Issues](https://github.com/marioagutierrez/venepagos-sdk/issues)
- **Email**: soporte@venepagos.com.ve
- **Discord**: [Comunidad VenePagos](https://discord.gg/venepagos)

## 📄 Licencia

MIT © 2024 VenePagos

---

<div align="center">
  <strong>¿Te gusta el SDK? ¡Dale una ⭐ en GitHub!</strong>
</div>
