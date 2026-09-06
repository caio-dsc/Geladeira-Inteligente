/**
 * Testes unitários para validação de imagens, otimização e serviço de upload do Cloudinary.
 * Executa via: npx tsx src/services/imageUploadService.test.ts
 */

import { validateImageFile, calculateAspectRatioFit } from '../utils/imageOptimizer';
import { ImageUploadService } from './imageUploadService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ SUCESSO: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Iniciando testes de Image Optimizer & Cloudinary Upload Service...\n');

  // =========================================================================
  // 1. Validação de Tipos MIME e Tamanho de Imagens
  // =========================================================================
  console.log('--- 1. Testes de Validação de Arquivo ---');

  const validJpg = validateImageFile({ type: 'image/jpeg', size: 1024 * 500, name: 'foto.jpg' });
  assert(validJpg.valid === true, 'Deve aceitar arquivo image/jpeg');

  const validPng = validateImageFile({ type: 'image/png', size: 1024 * 800, name: 'foto.png' });
  assert(validPng.valid === true, 'Deve aceitar arquivo image/png');

  const validWebp = validateImageFile({ type: 'image/webp', size: 1024 * 300, name: 'foto.webp' });
  assert(validWebp.valid === true, 'Deve aceitar arquivo image/webp');

  const invalidGif = validateImageFile({ type: 'image/gif', size: 1024 * 200, name: 'anim.gif' });
  assert(invalidGif.valid === false && invalidGif.error?.includes('não suportado'), 'Deve rejeitar image/gif');

  const invalidPdf = validateImageFile({ type: 'application/pdf', size: 1024 * 100, name: 'doc.pdf' });
  assert(invalidPdf.valid === false && invalidPdf.error?.includes('não suportado'), 'Deve rejeitar application/pdf');

  const emptyFile = validateImageFile({ type: 'image/jpeg', size: 0, name: 'vazio.jpg' });
  assert(emptyFile.valid === false && emptyFile.error?.includes('vazio'), 'Deve rejeitar arquivo de 0 bytes');

  const oversizeFile = validateImageFile(
    { type: 'image/jpeg', size: 20 * 1024 * 1024, name: 'enorme.jpg' },
    15 * 1024 * 1024
  );
  assert(oversizeFile.valid === false && oversizeFile.error?.includes('muito grande'), 'Deve rejeitar arquivo que excede tamanho máximo');

  // =========================================================================
  // 2. Cálculo Proporcional de Aspect Ratio
  // =========================================================================
  console.log('\n--- 2. Testes de Cálculo de Dimensões (Aspect Ratio) ---');

  const landscape = calculateAspectRatioFit(2400, 1200, 1200, 1200);
  assert(landscape.width === 1200 && landscape.height === 600, 'Redimensionamento paisagem (2:1 -> 1200x600)');

  const portrait = calculateAspectRatioFit(1200, 2400, 1200, 1200);
  assert(portrait.width === 600 && portrait.height === 1200, 'Redimensionamento retrato (1:2 -> 600x1200)');

  const squareLarge = calculateAspectRatioFit(3000, 3000, 1200, 1200);
  assert(squareLarge.width === 1200 && squareLarge.height === 1200, 'Redimensionamento quadrado (3000 -> 1200)');

  const smallImage = calculateAspectRatioFit(800, 600, 1200, 1200);
  assert(smallImage.width === 800 && smallImage.height === 600, 'Não deve fazer upscale em imagem menor que o limite');

  // =========================================================================
  // 3. Validação de Parâmetros do ImageUploadService
  // =========================================================================
  console.log('\n--- 3. Testes de Parâmetros do ImageUploadService ---');

  const uploadService = new ImageUploadService();

  try {
    await uploadService.uploadRecipeImage('', {} as any);
    assert(false, 'Deveria lançar erro para recipeId vazio');
  } catch (err: any) {
    assert(err.message.includes('recipeId'), 'Lança erro amigável se recipeId for vazio');
  }

  try {
    await uploadService.uploadRecipeImage('recipe-123', null as any);
    assert(false, 'Deveria lançar erro para arquivo nulo');
  } catch (err: any) {
    assert(err.message.includes('Nenhum arquivo'), 'Lança erro amigável se arquivo for nulo');
  }

  // =========================================================================
  // 4. Mock do XMLHttpRequest para Testar Fluxos de Upload
  // =========================================================================
  console.log('\n--- 4. Testes de Rede / Resposta do Cloudinary com Mock de XHR ---');

  class MockXHR {
    public static currentStatus = 200;
    public static currentStatusText = 'OK';
    public static currentResponseText = '';
    public static triggerMode: 'success' | 'invalid_response' | 'api_error' | 'network_error' | 'timeout' = 'success';

    public get status() {
      return MockXHR.currentStatus;
    }
    public get statusText() {
      return MockXHR.currentStatusText;
    }
    public get responseText() {
      return MockXHR.currentResponseText;
    }

    public timeout = 0;
    public upload = {
      onprogress: null as ((event: any) => void) | null,
    };
    public onload: (() => void) | null = null;
    public onerror: (() => void) | null = null;
    public ontimeout: (() => void) | null = null;
    public onabort: (() => void) | null = null;

    public open(method: string, url: string) {
      // no-op
    }

    public send(data: any) {
      // Simula progresso
      if (this.upload.onprogress) {
        this.upload.onprogress({ lengthComputable: true, loaded: 500, total: 1000 });
      }

      // Dispara o callback programado
      setTimeout(() => {
        if (MockXHR.triggerMode === 'success' && this.onload) {
          this.onload();
        } else if (MockXHR.triggerMode === 'invalid_response' && this.onload) {
          this.onload();
        } else if (MockXHR.triggerMode === 'api_error' && this.onload) {
          this.onload();
        } else if (MockXHR.triggerMode === 'network_error' && this.onerror) {
          this.onerror();
        } else if (MockXHR.triggerMode === 'timeout' && this.ontimeout) {
          this.ontimeout();
        }
      }, 5);
    }
  }

  // Instala o mock no escopo global
  (globalThis as any).XMLHttpRequest = MockXHR;

  // 4.1 Sucesso do Upload
  MockXHR.triggerMode = 'success';
  MockXHR.currentStatus = 200;
  MockXHR.currentResponseText = JSON.stringify({
    asset_id: 'abc123',
    public_id: 'recipe_sample',
    secure_url: 'https://res.cloudinary.com/vlqg76jp/image/upload/v12345/recipes/bolo_de_cenoura.jpg',
  });

  let progressCaptured = 0;
  const mockFile = new Blob(['simulated-image-bytes'], { type: 'image/jpeg' });
  const successResult = await uploadService.uploadRecipeImage(
    'sample-recipe',
    mockFile,
    (pct) => {
      progressCaptured = pct;
    }
  );

  assert(
    successResult === 'https://res.cloudinary.com/vlqg76jp/image/upload/v12345/recipes/bolo_de_cenoura.jpg',
    'Retorna secure_url com sucesso no fluxo 200'
  );
  assert(progressCaptured === 100, 'Progresso atinge 100% ao concluir com sucesso');

  // 4.2 Resposta Inválida (HTTP 200 mas sem secure_url nem url)
  MockXHR.triggerMode = 'invalid_response';
  MockXHR.currentStatus = 200;
  MockXHR.currentResponseText = JSON.stringify({
    foo: 'bar', // sem URL
  });

  try {
    await uploadService.uploadRecipeImage('sample-recipe', mockFile);
    assert(false, 'Deveria falhar para resposta sem URL segura');
  } catch (err: any) {
    assert(err.message.includes('URL segura da foto não foi retornada'), 'Trata resposta HTTP 200 sem URL pública');
  }

  // 4.3 Erro da API do Cloudinary (HTTP 400 com mensagem de erro da API)
  MockXHR.triggerMode = 'api_error';
  MockXHR.currentStatus = 400;
  MockXHR.currentStatusText = 'Bad Request';
  MockXHR.currentResponseText = JSON.stringify({
    error: {
      message: 'Upload preset not found: geladeira_invalid',
    },
  });

  try {
    await uploadService.uploadRecipeImage('sample-recipe', mockFile);
    assert(false, 'Deveria falhar quando Cloudinary retornar erro 400');
  } catch (err: any) {
    assert(err.message.includes('Upload preset not found'), 'Propaga e formata a mensagem de erro específica do Cloudinary');
  }

  // 4.4 Erro de Rede
  MockXHR.triggerMode = 'network_error';
  try {
    await uploadService.uploadRecipeImage('sample-recipe', mockFile);
    assert(false, 'Deveria falhar em caso de erro de rede');
  } catch (err: any) {
    assert(err.message.includes('Erro de rede ao conectar com o serviço de imagens'), 'Trata erro de conexão de rede amigavelmente');
  }

  // 4.5 Timeout
  MockXHR.triggerMode = 'timeout';
  try {
    await uploadService.uploadRecipeImage('sample-recipe', mockFile, undefined, 5000);
    assert(false, 'Deveria falhar em caso de timeout');
  } catch (err: any) {
    assert(err.message.includes('Tempo limite de envio excedido'), 'Trata timeout com mensagem clara');
  }

  console.log('\n🎉 Todos os testes de Image Optimizer & Cloudinary passaram com 100% de sucesso!');
}

runTests().catch((err) => {
  console.error('Erro fatal nos testes:', err);
  process.exit(1);
});
