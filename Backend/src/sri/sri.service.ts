import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SriService {
  /**
   * Valida un número de Cédula o RUC ecuatoriano usando el algoritmo de coeficiente mod 10.
   */
  validarDocumentoEcuador(documento: string): boolean {
    if (!documento || (documento.length !== 10 && documento.length !== 13)) {
      return false;
    }

    // Verificar que sean solo dígitos
    if (!/^\d+$/.test(documento)) {
      return false;
    }

    const cedula = documento.substring(0, 10);
    const provincia = parseInt(cedula.substring(0, 2), 10);

    if (provincia < 1 || provincia > 24) {
      // 30 es para extranjeros registrados
      if (provincia !== 30) {
        return false;
      }
    }

    const tercerDigito = parseInt(cedula.substring(2, 3), 10);
    if (tercerDigito < 0 || tercerDigito > 6) {
      // Si el tercer dígito es 9 es RUC de persona jurídica o extranjeros
      // Si es 6 es RUC de entidad pública
      if (tercerDigito !== 9 && tercerDigito !== 6) {
        // En cédulas, el tercer dígito debe ser menor a 6
        if (documento.length === 10 && tercerDigito >= 6) {
          return false;
        }
      }
    }

    // Validación dígito verificador (Algoritmo Mod 10)
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
      if (valor >= 10) {
        valor -= 9;
      }
      suma += valor;
    }

    const total = sum => {
      const residuo = sum % 10;
      return residuo === 0 ? 0 : 10 - residuo;
    };

    const digitoVerificador = parseInt(cedula.charAt(9), 10);
    return total(suma) === digitoVerificador;
  }

  /**
   * Consulta datos informativos en el SRI o Registro Civil por Cédula o RUC
   */
  async consultarDocumento(documento: string) {
    // 1. Validar el documento sintácticamente primero
    const isValid = this.validarDocumentoEcuador(documento);
    if (!isValid) {
      throw new HttpException(
        'El número de identificación no es una cédula o RUC válido de Ecuador.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Mapeo dinámico de provincia y capital por los dos primeros dígitos de la cédula/RUC
    const provCode = documento.substring(0, 2);
    const provMap: Record<string, { provincia: string; capital: string }> = {
      '01': { provincia: 'AZUAY', capital: 'CUENCA' },
      '02': { provincia: 'BOLIVAR', capital: 'GUARANDA' },
      '03': { provincia: 'CAÑAR', capital: 'AZOGUES' },
      '04': { provincia: 'CARCHI', capital: 'TULCAN' },
      '05': { provincia: 'COTOPAXI', capital: 'LATACUNGA' },
      '06': { provincia: 'CHIMBORAZO', capital: 'RIOBAMBA' },
      '07': { provincia: 'EL ORO', capital: 'MACHALA' },
      '08': { provincia: 'ESMERALDAS', capital: 'ESMERALDAS' },
      '09': { provincia: 'GUAYAS', capital: 'GUAYAQUIL' },
      '10': { provincia: 'IMBABURA', capital: 'IBARRA' },
      '11': { provincia: 'LOJA', capital: 'LOJA' },
      '12': { provincia: 'LOS RIOS', capital: 'BABAHOYO' },
      '13': { provincia: 'MANABI', capital: 'PORTOVIEJO' },
      '14': { provincia: 'MORONA SANTIAGO', capital: 'MACAS' },
      '15': { provincia: 'NAPO', capital: 'TENA' },
      '16': { provincia: 'PASTAZA', capital: 'PUYO' },
      '17': { provincia: 'PICHINCHA', capital: 'QUITO' },
      '18': { provincia: 'TUNGURAHUA', capital: 'AMBATO' },
      '19': { provincia: 'ZAMORA CHINCHIPE', capital: 'ZAMORA' },
      '20': { provincia: 'GALAPAGOS', capital: 'PUERTO BAQUERIZO MORENO' },
      '21': { provincia: 'SUCUMBIOS', capital: 'NUEVA LOJA' },
      '22': { provincia: 'ORELLANA', capital: 'FRANCISCO DE ORELLANA' },
      '23': { provincia: 'SANTO DOMINGO DE LOS TSACHILAS', capital: 'SANTO DOMINGO' },
      '24': { provincia: 'SANTA ELENA', capital: 'SANTA ELENA' },
      '30': { provincia: 'EXTRANJERO', capital: 'EXTRANJERO' },
    };
    const provInfo = provMap[provCode] || { provincia: 'ECUADOR', capital: 'QUITO' };

    // Determinar RUC para consulta del SRI
    let rucQuery = documento;
    if (documento.length === 10) {
      rucQuery = `${documento}001`; // RUC natural por defecto
    }

    // 2. Intentar consultar el endpoint oficial libre del SRI (SRI en línea / Catastro Móvil)
    try {
      const sriUrl = `https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc?ruc=${rucQuery}`;
      const response = await axios.get(sriUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
        },
      });

      if (response.status === 200 && response.data) {
        const list = response.data;
        const data = Array.isArray(list) ? list[0] : list;
        if (data) {
          const nombreCompleto = data.razonSocial || '';
          if (nombreCompleto) {
            return {
              success: true,
              source: 'SRI',
              identification: documento,
              name: nombreCompleto.trim().toUpperCase(),
              address: `${provInfo.provincia}, ECUADOR`,
              city: provInfo.capital,
              phone: '',
              email: '',
              isRuc: documento.length === 13,
              class: data.tipoContribuyente || 'PERSONA NATURAL',
            };
          }
        }
      }
    } catch (sriError) {
      console.log('Fallo de consulta al SRI oficial:', sriError.message);
    }

    // Si no se encuentra en el SRI
    throw new HttpException(
      'No se encontró información para este documento en los registros del SRI.',
      HttpStatus.NOT_FOUND,
    );
  }
}
