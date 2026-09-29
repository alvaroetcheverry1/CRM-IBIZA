# Contrato de Encargado del Tratamiento (DPA)
### Neural CRM SL y Agencias Inmobiliarias

**Fecha:** [Fecha de firma]  
**Neural CRM SL** (en adelante, "Proveedora")  
**Agencia [Nombre Agencia]** (en adelante, "Cliente")

---

## 1. Definiciones

- **Datos Personales:** Cualquier información sobre una persona física identificada o identificable.
- **Sujeto de Datos:** Cliente, propietario o interesado cuyos datos se procesan.
- **Procesamiento:** Cualquier operación sobre datos personales.
- **Confidencialidad:** Obligación de no revelar información confidencial.

---

## 2. Objeto del Contrato

Este DPA regula el tratamiento de datos personales por parte de la Proveedora en nombre del Cliente para prestar los servicios del CRM Inmobiliario Neural.

---

## 3. Tipos de Datos y Categorías de Sujetos

| Tipo de Datos | Categoría de Sujeto | Finalidad |
|---------------|---------------------|-----------|
| Nombre, email, teléfono | Clientes, propietarios, leads | Gestión de relaciones comerciales |
| Datos de propiedades | Propietarios, clientes | Gestión de inventario |
| Datos de pagos | Clientes, propietarios | Facturación y cobros |
| Notas y actividades | Clientes | Historial de interacciones |

---

## 4. Obligaciones de la Proveedora (Encargado del Tratamiento)

### 4.1 Tratamiento según Instrucciones
La Proveedora tratará los Datos Personales únicamente según las instrucciones escritas del Cliente, salvo obligación legal.

### 4.2 Seguridad
Implementa medidas técnicas y organizativas:
- Cifrado AES-256-GCM en campos sensibles
- TLS 1.3 en comunicaciones
- Rate limiting y WAF
- Backups diarios cifrados
- Acceso RBAC (5 roles)
- Auditoría de accesos

### 4.3 Subprocesadores
La Proveedora solo utiliza subprocesadores autorizados:
- **AWS/Supabase:** Almacenamiento y base de datos
- **OpenAI:** Procesamiento de IA (solo con datos anónimos o encriptados)
- **Twilio/WhatsApp:** Envío de mensajes (con DPA firmado)

La Proveedora informará al Cliente de cualquier nuevo subprocesador.

### 4.4 Notificación de Brechas
La Proveedora notificará al Cliente dentro de las 24h de una brecha de seguridad.

### 4.5 Cooperación con AEPD
La Proveedora colaborará con la autoridad de control en los procesos de supervisión.

---

## 5. Obligaciones del Cliente (Responsable del Tratamiento)

### 5.1 Legalidad
El Cliente garantiza que tiene base legal para el tratamiento y que los datos son exactos y actualizados.

### 5.2 DPO
El Cliente designa su propio Delegado de Protección de Datos (si aplica).

### 5.3 Derechos de Sujetos
El Cliente responde ante las reclamaciones de los sujetos de datos (acceso, rectificación, supresión, portabilidad).

---

## 6. Transferencias Internacionales

Los Datos Personales no se transferirán fuera del EEE salvo con cláusulas tipo de protección estándar de la UE (SCCs) o mecanismos equivalentes.

---

## 7. Retención y Supresión

### 7.1 Retención
Los Datos Personales se conservarán durante el tiempo necesario para prestar los servicios y cumplir obligaciones legales (mínimo 5 años para obligaciones fiscales).

### 7.2 Devolución
Al finalizar el contrato, la Proveedora devolverá o suprimirá los Datos Personales según instrucción escrita del Cliente.

---

## 8. Auditorías

El Cliente podrá solicitar auditorías de cumplimiento una vez al año, con 30 días de preaviso y en horario razonable.

---

## 9. Duración y Terminación

### 9.1 Duración
Este DPA tiene la misma duración que el contrato principal de servicios.

### 9.2 Terminación
Al terminar el contrato, la Proveedora continuará protegiendo los Datos Personales según este DPA.

---

## 10. Legislación y Jurisdicción

Este DPA se rige por la legislación española. Cualquier controversia se someterá a los tribunales de Eivissa, Ibiza.

---

## 11. Firma

**Por Neural CRM SL:**
_________________________
Nombre: 
Cargo: Director
Fecha:

**Por [Nombre Agencia]:**
_________________________
Nombre: 
Cargo: 
Fecha:

---

*Este DPA cumple con el artículo 28 del RGPD y la normativa española de protección de datos.*
