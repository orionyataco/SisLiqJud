import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ResultadoMensal, ResumoFinal, ParametrosCalculo, ConfiguracaoRelatorio, MODALIDADE_LABELS } from './types';

const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

export const gerarRelatorioPDF = (
  resultados: ResultadoMensal[],
  resumo: ResumoFinal,
  parametros: ParametrosCalculo,
  config: ConfiguracaoRelatorio
) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const cinzaClaro: [number, number, number] = [241, 245, 249];
  const corPrimariaRgb = hexToRgb(config.corPrimaria);

  doc.setFillColor(corPrimariaRgb[0], corPrimariaRgb[1], corPrimariaRgb[2]);
  doc.rect(0, 0, 297, 25, 'F');

  if (config.logoBase64) {
    try {
      doc.addImage(config.logoBase64, 'PNG', 14, 5, 15, 15);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(config.nomeEscritorio.toUpperCase(), 35, 14);
      doc.setFontSize(8);
      doc.text('Memória de Cálculo Judicial', 35, 19);
    } catch (e) {
      console.error('Erro ao adicionar logo ao PDF', e);
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(config.nomeEscritorio.toUpperCase(), 14, 14);
    doc.setFontSize(8);
    doc.text('Sistema de Liquidação de Sentença Judicial - Profissional', 14, 20);
  }

  doc.setFontSize(7);
  doc.text(config.enderecoEscritorio, 283, 10, { align: 'right' });
  doc.text(`${config.telefoneEscritorio} | ${config.emailEscritorio}`, 283, 15, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO PROCESSO', 14, 35);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const col1 = 14;
  const col2 = 110;
  const col3 = 205;
  let currentY = 41;

  doc.text(`Processo nº: ${parametros.numeroProcesso || 'N/I'}`, col1, currentY);
  doc.text(`Requerente: ${parametros.nomeRequerente || 'N/I'}`, col2, currentY);
  doc.text(`Requerido: ${parametros.nomeRequerido || 'N/I'}`, col3, currentY);

  currentY += 6;
  doc.text(`Modalidade: ${MODALIDADE_LABELS[parametros.modalidade] || 'N/I'}`, col1, currentY);
  doc.text(`Assunto: ${parametros.assunto || 'N/I'}`, col2, currentY);
  doc.text(`Tramitação: ${parametros.tramitacao || 'N/I'}`, col3, currentY);

  currentY += 6;
  doc.text(`Citação: ${parametros.dataCitacao.toLocaleDateString('pt-BR')}`, col1, currentY);
  doc.text(`Sentença: ${parametros.dataSentenca.toLocaleDateString('pt-BR')}`, col2, currentY);
  doc.text(`Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}`, col3, currentY);

  autoTable(doc, {
    startY: 60,
    margin: { left: 14, right: 14 },
    tableWidth: 120,
    head: [['ITEM DO CÁLCULO', 'VALOR APURADO (R$)']],
    body: [
      ['Bruto Total Devido', { content: resumo.totalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: 'bold' } }],
      ['Previdência Social', parametros.aplicarPrevidencia ? `(-) ${resumo.valorPrevidencia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'NÃO APLICADA'],
      ['Imposto de Renda (RRA)', parametros.aplicarIR ? `(-) ${resumo.valorIR.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'ISENTO (IN 1500/2014)'],
      ['Honorários Advocatícios', resumo.honorariosAdvocaticios.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
      ['VALOR LÍQUIDO A RECEBER', { content: resumo.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: 'bold', fontSize: 9, fillColor: cinzaClaro } }],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: corPrimariaRgb, textColor: [255, 255, 255] },
    columnStyles: { 1: { halign: 'right' } },
  });

  let maxYAposResumo = (doc as any).lastAutoTable.finalY;

  if (parametros.observacoesCustomizadas && parametros.observacoesCustomizadas.length > 0) {
    const obsBody = parametros.observacoesCustomizadas.map(obs => [obs.titulo, obs.descricao]);

    autoTable(doc, {
      startY: 60,
      margin: { left: 140, right: 14 },
      head: [[{ content: 'OBSERVAÇÕES', colSpan: 2, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0, 0, 0] } }]],
      body: obsBody,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.5, valign: 'middle' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40, halign: 'center' },
        1: { halign: 'left' }
      }
    });

    if ((doc as any).lastAutoTable.finalY > maxYAposResumo) {
      maxYAposResumo = (doc as any).lastAutoTable.finalY;
    }
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TABELA DETALHADA', 14, maxYAposResumo + 10);

  const headersRubricas = parametros.verbasConfiguradas.map(v => v.nome);
  const head: string[][] = [[
    'Comp.', 'Venc. Dev.', 'Venc. Rec.', 'Dif. Venc.', ...headersRubricas,
    '13º', 'Férias', 'Índice', 'Fator Corr.', 'Juros (Taxa)',
    'Base Total Corr.', 'Juros', 'Previdência', 'Total'
  ]];

  const body = resultados.map((r) => {
    const valoresRubricas = parametros.verbasConfiguradas.map(v =>
      (r.verbasDiferencas?.[v.id] || 0)
    ).map(v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

    return [
      r.competencia,
      r.valorDevido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.diferencaVencimento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ...valoresRubricas,
      r.reflexo13.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.reflexoFerias.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.indiceUtilizado,
      r.fatorCorrecao.toFixed(4),
      `${(r.taxaJuros * 100).toFixed(2)}%`,
      r.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.valorJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.valorPrevidenciaCorrigida.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.totalDoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ];
  });

  autoTable(doc, {
    startY: maxYAposResumo + 14,
    head: head,
    body: body,
    styles: { fontSize: 5, cellPadding: 0.5, halign: 'center' },
    headStyles: { fillColor: [100, 116, 139], halign: 'center' },
    columnStyles: {
      0: { cellWidth: 12 },
      [head[0].length - 1]: { fontStyle: 'bold' }
    },
    didDrawPage: (data) => {
      const str = `Página ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setTextColor(150, 150, 150);
      doc.text(str, data.settings.margin.left, pageHeight - 10);
      doc.text(`${config.nomeEscritorio} - ${config.emailEscritorio}`, 283, pageHeight - 10, { align: 'right' });
    }
  });

  const nomeArquivo = (parametros.nomeRequerente || 'Relatorio').replace(/ /g, '_');
  doc.save(`Memoria_Calculo_${nomeArquivo}.pdf`);
};
