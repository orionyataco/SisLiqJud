import Papa from 'papaparse';
import { IndiceMensal, LancamentoMensal } from './types';

export const importarIndicesCSV = (file: File): Promise<IndiceMensal[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const indices: IndiceMensal[] = results.data.map((row: any) => {
            const valStr = String(row.valor || row.Valor || '0');
            const competencia = String(row.data || row.competencia || row.Data || '');
            return {
              competencia,
              valor: parseFloat(valStr.replace(/\./g, '').replace(',', '.'))
            };
          }).filter(i => i.competencia && !isNaN(i.valor));
          resolve(indices);
        } catch (err) {
          reject(new Error('Erro ao processar estrutura do arquivo CSV.'));
        }
      },
      error: (error) => reject(error)
    });
  });
};

export const importarFichaFinanceiraCSV = (file: File): Promise<Partial<LancamentoMensal>[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const lancamentos: Partial<LancamentoMensal>[] = results.data.map((row: any) => {
            const valStr = String(row.valor || row.recebido || row.Recebido || '0');
            const competencia = String(row.competencia || row.data || row.Competencia || '');
            return {
              competencia,
              valorRecebido: parseFloat(valStr.replace(/\./g, '').replace(',', '.'))
            };
          }).filter(l => l.competencia && !isNaN(l.valorRecebido || 0));
          resolve(lancamentos);
        } catch (err) {
          reject(new Error('Erro ao processar ficha financeira.'));
        }
      },
      error: (error) => reject(error)
    });
  });
};
