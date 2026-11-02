const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateSignatureSeal() {
  const targetDirFrontend = path.join(__dirname, '..', '..', 'Frontend', 'public', 'images', 'firma');
  const targetDirBackend = path.join(__dirname, '..', 'assets');

  if (!fs.existsSync(targetDirFrontend)) {
    fs.mkdirSync(targetDirFrontend, { recursive: true });
  }
  if (!fs.existsSync(targetDirBackend)) {
    fs.mkdirSync(targetDirBackend, { recursive: true });
  }

  // SVG con sello institucional y firma estilizada del Gerente General
  const svg = `
  <svg width="400" height="150" viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg">
    <!-- Sello circular sutil a la izquierda -->
    <g transform="translate(65, 75)" opacity="0.85">
      <circle cx="0" cy="0" r="48" fill="none" stroke="#1e3a8a" stroke-width="2.5" stroke-dasharray="4,2"/>
      <circle cx="0" cy="0" r="42" fill="none" stroke="#1e3a8a" stroke-width="1.2"/>
      
      <!-- Textos circulares -->
      <path id="circleTop" d="M -34,0 A 34,34 0 0,1 34,0" fill="none" />
      <path id="circleBottom" d="M 34,0 A 34,34 0 0,1 -34,0" fill="none" />
      
      <text font-size="7.5" font-family="Arial, Helvetica, sans-serif" font-weight="900" fill="#1e3a8a" letter-spacing="1">
        <textPath href="#circleTop" startOffset="50%" text-anchor="middle">
          HOSPITAL DEL COMPUTADOR
        </textPath>
      </text>
      
      <text font-size="6.5" font-family="Arial, Helvetica, sans-serif" font-weight="bold" fill="#1e3a8a" letter-spacing="0.8">
        <textPath href="#circleBottom" startOffset="50%" text-anchor="middle">
          GERENCIA GENERAL
        </textPath>
      </text>
      
      <!-- Icono central del sello -->
      <path d="M -12,-8 L 12,-8 L 12,6 L -12,6 Z M -4,6 L -4,11 L 4,11 L 4,6 Z M -8,11 L 8,11" fill="none" stroke="#1e3a8a" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M -6,-1 L 6,-1" stroke="#1e3a8a" stroke-width="1.2"/>
      <circle cx="0" cy="-4" r="1.5" fill="#1e3a8a"/>
    </g>

    <!-- Trazo de Firma Manuscrita Electrónica Autorizada (Azul marino tinta) -->
    <g stroke="#0f2b61" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <!-- Rúbrica principal fluida -->
      <path d="M 120 85 C 135 45, 145 25, 160 30 C 175 35, 165 75, 155 95 C 150 105, 180 60, 205 62 C 225 64, 215 90, 235 75 C 255 60, 260 85, 280 68 C 295 55, 310 70, 335 60" stroke-width="2.8"/>
      
      <!-- Lazo inferior y bucle decorativo -->
      <path d="M 130 92 C 160 120, 240 125, 315 105 C 345 97, 360 85, 330 92 C 290 102, 210 108, 140 100" stroke-width="2.2"/>
      
      <!-- Trazos de detalle y firma -->
      <path d="M 175 48 C 190 40, 215 42, 230 46" stroke-width="1.8"/>
      <path d="M 245 52 C 260 48, 275 50, 290 53" stroke-width="1.8"/>
    </g>

    <!-- Texto de Certificación Digital -->
    <g font-family="Arial, Helvetica, sans-serif" fill="#1e3a8a">
      <text x="145" y="126" font-size="8.5" font-weight="bold">FIRMA ELECTRÓNICA AUTORIZADA</text>
      <text x="145" y="137" font-size="7" fill="#475569" font-weight="600">Certificado Digital de Representante Legal HDC</text>
    </g>
  </svg>
  `;

  const pngBuffer = await sharp(Buffer.from(svg))
    .png({ quality: 100 })
    .toBuffer();

  const fileFrontend = path.join(targetDirFrontend, 'firma-autorizada-hdc.png');
  const fileBackend = path.join(targetDirBackend, 'firma-autorizada-hdc.png');

  fs.writeFileSync(fileFrontend, pngBuffer);
  fs.writeFileSync(fileBackend, pngBuffer);

  console.log('✓ Firma autorizada generada en:', fileFrontend);
  console.log('✓ Firma autorizada generada en:', fileBackend);

  // Convertir también el logo oficial SVG a PNG de alta resolución para incrustar en PDF
  const logoSvgPath = path.join(__dirname, '..', '..', 'Frontend', 'public', 'images', 'logo', 'logo.svg');
  if (fs.existsSync(logoSvgPath)) {
    const svgContent = fs.readFileSync(logoSvgPath);
    const logoPngBuffer = await sharp(svgContent).resize({ width: 800 }).png().toBuffer();
    const logoBackendPath = path.join(targetDirBackend, 'logo_hdc.png');
    fs.writeFileSync(logoBackendPath, logoPngBuffer);
    console.log('✓ Logo oficial HDC PNG generado en:', logoBackendPath);
  }
}

generateSignatureSeal().catch(console.error);
