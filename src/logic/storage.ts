import { CalculoSalvo } from './types';

const STORAGE_KEY = 'sisliqjud_calculos';

export const salvarCalculo = (calculo: Omit<CalculoSalvo, 'id' | 'dataCriacao' | 'dataAtualizacao'> & { id?: string }) => {
  const calculosExistentes = listarCalculos();
  
  const agora = new Date().toISOString();
  let novoCalculo: CalculoSalvo;

  if (calculo.id) {
    // Atualizar existente
    const index = calculosExistentes.findIndex(c => c.id === calculo.id);
    if (index !== -1) {
      novoCalculo = {
        ...calculosExistentes[index],
        ...calculo,
        id: calculo.id,
        dataAtualizacao: agora
      };
      calculosExistentes[index] = novoCalculo;
    } else {
      // Caso o ID não exista por algum motivo
      novoCalculo = {
        ...calculo,
        id: crypto.randomUUID(),
        dataCriacao: agora,
        dataAtualizacao: agora
      } as CalculoSalvo;
      calculosExistentes.push(novoCalculo);
    }
  } else {
    // Criar novo
    novoCalculo = {
      ...calculo,
      id: crypto.randomUUID(),
      dataCriacao: agora,
      dataAtualizacao: agora
    } as CalculoSalvo;
    calculosExistentes.push(novoCalculo);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(calculosExistentes));
  return novoCalculo;
};

export const listarCalculos = (): CalculoSalvo[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    // Garantir que datas voltem como objetos Date se necessário, 
    // mas na interface CalculoSalvo são strings. 
    // No entanto, ParametrosCalculo tem Dates. 
    // JSON.parse transforma Date em string. Precisamos re-hidratar.
    return parsed.map((c: any) => ({
      ...c,
      parametros: {
        ...c.parametros,
        dataAjuizamento: new Date(c.parametros.dataAjuizamento),
        dataCitacao: new Date(c.parametros.dataCitacao),
        dataSentenca: new Date(c.parametros.dataSentenca)
      }
    }));
  } catch (e) {
    console.error('Erro ao ler cálculos do localStorage', e);
    return [];
  }
};

export const buscarCalculoPorId = (id: string): CalculoSalvo | undefined => {
  return listarCalculos().find(c => c.id === id);
};

export const deletarCalculo = (id: string) => {
  const calculos = listarCalculos().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(calculos));
};
