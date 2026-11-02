import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';

@Injectable()
export class SriService {
  private readonly httpsAgent = new https.Agent({ rejectUnauthorized: false });

  /**
   * Valida un número de Cédula o RUC ecuatoriano:
   * - Cédula (10 dígitos) y RUC Persona Natural: Algoritmo Módulo 10
   * - RUC Sociedad Privada (13 dígitos, tercer dígito 9): Algoritmo Módulo 11
   * - RUC Entidad Pública (13 dígitos, tercer dígito 6): Algoritmo Módulo 11
   */
  validarDocumentoEcuador(documento: string): boolean {
    if (!documento || (documento.length !== 10 && documento.length !== 13)) {
      return false;
    }

    // Verificar que sean solo dígitos
    if (!/^\d+$/.test(documento)) {
      return false;
    }

    const provincia = parseInt(documento.substring(0, 2), 10);
    if ((provincia < 1 || provincia > 24) && provincia !== 30) {
      return false;
    }

    const tercerDigito = parseInt(documento.substring(2, 3), 10);

    // 1. Cédulas y RUC de Persona Natural (tercer dígito < 6)
    if (tercerDigito < 6) {
      const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
      let suma = 0;

      for (let i = 0; i < 9; i++) {
        let valor = parseInt(documento.charAt(i), 10) * coeficientes[i];
        if (valor >= 10) {
          valor -= 9;
        }
        suma += valor;
      }

      const residuo = suma % 10;
      const digitoVerificador = residuo === 0 ? 0 : 10 - residuo;
      return digitoVerificador === parseInt(documento.charAt(9), 10);
    }

    // 2. RUC de Persona Jurídica / Sociedad Privada (tercer dígito 9, 13 dígitos)
    if (tercerDigito === 9 && documento.length === 13) {
      const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
      let suma = 0;
      for (let i = 0; i < 9; i++) {
        suma += parseInt(documento.charAt(i), 10) * coeficientes[i];
      }
      const residuo = suma % 11;
      const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;
      return digitoVerificador === parseInt(documento.charAt(9), 10);
    }

    // 3. RUC de Entidad Pública (tercer dígito 6, 13 dígitos)
    if (tercerDigito === 6 && documento.length === 13) {
      const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
      let suma = 0;
      for (let i = 0; i < 8; i++) {
        suma += parseInt(documento.charAt(i), 10) * coeficientes[i];
      }
      const residuo = suma % 11;
      const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;
      return digitoVerificador === parseInt(documento.charAt(8), 10);
    }

    return false;
  }

  /**
   * Consulta datos informativos en el Registro Civil o SRI por Cédula o RUC
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

    // 2. Si es Cédula (10 dígitos), consultar primero el Web Service del Registro Civil (ACESS)
    if (documento.length === 10) {
      try {
        const rcUrl = `https://saccs.acess.gob.ec/wsc/registrocivil/infopersona/${documento}`;
        const rcResponse = await axios.get(rcUrl, {
          timeout: 10000,
          httpsAgent: this.httpsAgent,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json, text/plain, */*',
          },
        });

        if (rcResponse.status === 200 && rcResponse.data) {
          const info = rcResponse.data.response;
          if (info && info.Nombre && typeof info.Nombre === 'string' && info.Nombre.trim() !== '') {
            const calle = info.Calle && typeof info.Calle === 'string' ? info.Calle.trim() : '';
            const domicilio = info.Domicilio && typeof info.Domicilio === 'string' ? info.Domicilio.trim() : '';
            const direccionCompleta = [calle, domicilio].filter(Boolean).join(', ');

            return {
              success: true,
              source: 'REGISTRO_CIVIL',
              identification: documento,
              name: info.Nombre.trim().toUpperCase(),
              address: direccionCompleta || `${provInfo.provincia}, ECUADOR`,
              city: provInfo.capital,
              phone: '',
              email: '',
              isRuc: false,
              class: 'PERSONA NATURAL',
            };
          }
        }
      } catch (rcError: any) {
        console.log('Consulta a Registro Civil (ACESS) no concluyente o fallida:', rcError.message);
      }
    }

    // 3. Consulta al SRI (Directa para RUC de 13 dígitos o como fallback para Cédula)
    let rucQuery = documento;
    if (documento.length === 10) {
      rucQuery = `${documento}001`; // RUC natural por defecto
    }

    try {
      const sriUrl = `https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc?ruc=${rucQuery}`;
      const response = await axios.get(sriUrl, {
        timeout: 10000,
        httpsAgent: this.httpsAgent,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
    } catch (sriError: any) {
      console.log('Fallo de consulta al SRI oficial:', sriError.message);
    }

    // 4. Si no se encuentra ni en Registro Civil ni en el SRI
    throw new HttpException(
      'No se encontró información para este documento en los registros del Registro Civil ni del SRI.',
      HttpStatus.NOT_FOUND,
    );
  }
}
