// Tudo que é "seu" fica aqui: marca, preço, prazo, links e textos de prova social.
// Troque os valores e a página inteira se atualiza.

export const config = {
  marca: 'NOVA.EDIT',
  produto: 'Motor de Edição',
  slogan: 'Uma inteligência de edição para a sua IA',
  arquivoZip: 'NOVA-EDIT.zip',
  criador: { nome: 'Seu Nome', cargo: 'Criador do NOVA.EDIT', foto: '' },

  precoDe: 197,
  precoPor: 97,
  parcelas: 12,
  valorParcela: 10.04,
  garantiaDias: 7,
  acessoMeses: 12,

  campanha: 'Black Friday',
  // Fim da oferta (horário de Brasília)
  fimOferta: '2026-11-30T23:59:59-03:00',
  fimOfertaTexto: 'segunda, 30/11, às 23h59',
  fimOfertaCurto: 'seg, 30/11',

  bonus: {
    ativo: true,
    titulo: 'um notebook novo',
    dataSorteio: 'sábado, 05/12',
  },

  checkoutUrl: '#comprar', // troque pelo link do seu checkout
  regulamentoUrl: '#',

  alunos: '+10 mil alunos',
  empresa: 'SUA EMPRESA LTDA · CNPJ 00.000.000/0001-00',

  // Coloque aqui prints reais de clientes (imagens em /public)
  depoimentos: [
    { autor: '@cliente1', origem: 'comentário no Instagram', imagem: '' },
    { autor: '@cliente2', origem: 'comentário no Instagram', imagem: '' },
    { autor: '@cliente3', origem: 'stories do Instagram', imagem: '' },
  ],
}

export const brl = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })
