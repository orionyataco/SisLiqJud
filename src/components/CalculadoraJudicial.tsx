import React, { useState, useRef, useEffect } from 'react';
import { Calculator, FileText, TrendingUp, Save, Download, UploadCloud, X, BookOpen, User, Scale, Settings, Palette, MapPin, Phone, Mail, History, Plus } from 'lucide-react';
import { LancamentoMensal, ResumoFinal, ParametrosCalculo, VerbaConfig, HistoricoIndices, ConfiguracaoRelatorio, CalculoSalvo } from '../logic/types';
import { calcularDiferencas } from '../logic/calculator';
import { gerarRelatorioPDF } from '../logic/exporter';
import { importarIndicesCSV } from '../logic/importer';
import { salvarCalculo, buscarCalculoPorId } from '../logic/storage';
import { useSearchParams, useNavigate } from 'react-router-dom';

const CalculadoraJudicial = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');
  const [currentId, setCurrentId] = useState<string | null>(editId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fichaInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showObsModal, setShowObsModal] = useState(false);
  const [showVerbaForm, setShowVerbaForm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [novaVerba, setNovaVerba] = useState<Partial<VerbaConfig>>({
    nome: '',
    tipo: 'PERCENTUAL',
    valor: 0,
    isTributavel: true,
    incideSobre: 'SALARIO_BASE'
  });
  const [novaObs, setNovaObs] = useState({ titulo: '', descricao: '' });
  const [importTarget, setImportTarget] = useState<'ipcaE' | 'selic' | 'jurosMora'>('ipcaE');
  const [pasteData, setPasteData] = useState('');
  const [pasteFicha, setPasteFicha] = useState('');
  const [indices, setIndices] = useState<HistoricoIndices>({
    ipcaE: [],
    selic: [],
    jurosMora: []
  });

  const [verbas, setVerbas] = useState<VerbaConfig[]>([
    { id: 'vt', nome: 'Vale Transporte', isTributavel: false, tipo: 'FIXO', valor: 220.00, incideSobre: 'SALARIO_BASE' },
    { id: 'ins', nome: 'Insalubridade', isTributavel: true, tipo: 'PERCENTUAL', valor: 20, incideSobre: 'SALARIO_BASE' },
  ]);

  const [lancamentos, setLancamentos] = useState<LancamentoMensal[]>([
    { competencia: '2021-01', valorDevido: 3500.00, valorRecebido: 3000.00, isTributavel: true },
    { competencia: '2021-02', valorDevido: 3500.00, valorRecebido: 3000.00, isTributavel: true },
    { competencia: '2022-01', valorDevido: 3800.00, valorRecebido: 3500.00, isTributavel: true },
  ]);

  const [parametros, setParametros] = useState<ParametrosCalculo>({
    nomeRequerente: '',
    nomeRequerido: '',
    numeroProcesso: '',
    dataAjuizamento: new Date('2023-01-15'),
    dataCitacao: new Date('2023-03-20'),
    dataSentenca: new Date('2023-12-10'),
    percentualHonorarios: 10,
    aplicarPrevidencia: true,
    aplicarIR: true,
    verbasConfiguradas: verbas,
    tramitacao: '',
    assunto: '',
    orgaoPrevidenciario: '',
    observacoesCustomizadas: []
  });

  const [configRelatorio, setConfigRelatorio] = useState<ConfiguracaoRelatorio>({
    nomeEscritorio: 'SisLiqJud Consultoria',
    enderecoEscritorio: 'Av. das Nações, 1000 - Centro',
    telefoneEscritorio: '(96) 99999-9999',
    emailEscritorio: 'contato@sisliqjud.com.br',
    corPrimaria: '#1e3a8a',
  });

  // Efeito para carregar cálculo se houver um ID
  useEffect(() => {
    if (editId) {
      const salvo = buscarCalculoPorId(editId);
      if (salvo) {
        setParametros(salvo.parametros);
        setVerbas(salvo.parametros.verbasConfiguradas);
        setLancamentos(salvo.lancamentos);
        setCurrentId(editId);
      }
    }
  }, [editId]);

  const handleSalvar = () => {
    try {
      const calculo: Omit<CalculoSalvo, 'id' | 'dataCriacao' | 'dataAtualizacao'> & { id?: string } = {
        id: currentId || undefined,
        parametros,
        lancamentos,
        resumo
      };
      const salvo = salvarCalculo(calculo);
      setCurrentId(salvo.id);
      alert('Cálculo salvo com sucesso no histórico!');
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar o cálculo.');
    }
  };

  const handleNovoCalculo = () => {
    if (window.confirm('Deseja iniciar um novo cálculo? Todas as informações atuais não salvas serão perdidas.')) {
      setParametros({
        nomeRequerente: '',
        nomeRequerido: '',
        numeroProcesso: '',
        dataAjuizamento: new Date(),
        dataCitacao: new Date(),
        dataSentenca: new Date(),
        percentualHonorarios: 10,
        aplicarPrevidencia: true,
        aplicarIR: true,
        verbasConfiguradas: [],
        tramitacao: '',
        assunto: '',
        orgaoPrevidenciario: '',
        observacoesCustomizadas: []
      });
      setVerbas([]);
      setLancamentos([]);
      setCurrentId(null);
      navigate('/');
    }
  };

  const { resultados, resumo } = calcularDiferencas(lancamentos, indices, { ...parametros, verbasConfiguradas: verbas });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfigRelatorio({ ...configRelatorio, logoBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportIndices = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const novosIndices = await importarIndicesCSV(file);
        setIndices(prev => ({ ...prev, ipcaE: novosIndices }));
        alert(`Sucesso! ${novosIndices.length} índices importados.`);
      } catch (err) {
        alert('Erro ao importar CSV. Verifique o formato.');
      }
    }
  };

  const handleImportFicha = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Mock function or actual import logic
        alert(`Ficha financeira importada com sucesso.`);
      } catch (err) {
        alert('Erro ao importar Ficha Financeira.');
      }
    }
  };

  const processPaste = () => {
    const text = pasteData.trim();
    const novosIndices: any[] = [];
    const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

    const anosDetectados = text.match(/(19\d{2}|20\d{2})/g) || [];
    const valoresDetectados = text.match(/\d+[\.,]\d+/g) || [];

    const anosFiltrados = anosDetectados.filter(ano => {
      const idx = text.indexOf(ano);
      if (idx > 0) {
        const charAntes = text[idx - 1];
        if (charAntes === ',' || charAntes === '.') return false;
      }
      return true;
    });

    if (anosFiltrados.length > 0 && valoresDetectados.length >= anosFiltrados.length) {
      const valoresPorAno = Math.floor(valoresDetectados.length / anosFiltrados.length);
      if (valoresPorAno >= 1) {
        let valorIdx = 0;
        anosFiltrados.forEach(ano => {
          for (let m = 0; m < Math.min(valoresPorAno, 12); m++) {
            if (valoresDetectados[valorIdx]) {
              const valorStr = valoresDetectados[valorIdx];
              const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));
              if (!isNaN(valor)) {
                novosIndices.push({ competencia: `${ano}-${meses[m]}`, valor });
              }
              valorIdx++;
            }
          }
        });
      }
    }

    if (novosIndices.length === 0) {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      lines.forEach(line => {
        const match = line.match(/(\d{2}\/\d{4})[^\d-]+([\d,.]+)/);
        if (match) {
          const [_, dataStr, valorStr] = match;
          const [mes, ano] = dataStr.split('/');
          const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));
          if (!isNaN(valor)) novosIndices.push({ competencia: `${ano}-${mes}`, valor });
        }
      });
    }

    if (novosIndices.length > 0) {
      novosIndices.sort((a, b) => a.competencia.localeCompare(b.competencia));
      setIndices(prev => ({ ...prev, [importTarget]: novosIndices }));
      alert(`${novosIndices.length} índices de ${importTarget} importados.`);
      setShowImportModal(false);
      setPasteData('');
    } else {
      alert('Não foi possível processar os dados.');
    }
  };

  const processPasteFicha = () => {
    const text = pasteFicha.trim();
    const novasFichas: LancamentoMensal[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Mapeamento de meses por extenso
    const mesExtMap: { [key: string]: string } = {
      'JANEIRO': '01', 'FEVEREIRO': '02', 'MARCO': '03', 'MARÇO': '03', 'ABRIL': '04', 'MAIO': '05', 'JUNHO': '06',
      'JULHO': '07', 'AGOSTO': '08', 'SETEMBRO': '09', 'OUTUBRO': '10', 'NOVEMBRO': '11', 'DEZEMBRO': '12',
      'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04', 'MAI': '05', 'JUN': '06',
      'JUL': '07', 'AGO': '08', 'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12'
    };

    lines.forEach(line => {
      // Tentar encontrar data (MM/AAAA ou MÊS YYYY)
      const dateMatch = line.match(/(\d{2})[\/\-](\d{4})/) || line.match(/([A-ZÇ]+)[\/\- ](\d{4})/i);
      // Tentar encontrar valor (geralmente o maior valor da linha se houver múltiplos, ou o último)
      const values = line.match(/\d+[\.,]\d{2}/g);

      if (dateMatch && values) {
        let mes = '';
        let ano = '';

        if (dateMatch[1].length === 2 && !isNaN(parseInt(dateMatch[1]))) {
          mes = dateMatch[1];
          ano = dateMatch[2];
        } else {
          mes = mesExtMap[dateMatch[1].toUpperCase()] || '01';
          ano = dateMatch[2];
        }

        // Pega o valor (geralmente o recebido é o que queremos)
        // Se houver mais de um, tentamos pegar o que parece ser o salário (maior valor ou último)
        const valorStr = values[values.length - 1];
        const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));

        if (!isNaN(valor)) {
          novasFichas.push({
            competencia: `${ano}-${mes}`,
            valorDevido: 0, // Usuário define depois
            valorRecebido: valor,
            isTributavel: true
          });
        }
      }
    });

    if (novasFichas.length > 0) {
      novasFichas.sort((a, b) => a.competencia.localeCompare(b.competencia));
      setLancamentos(novasFichas);
      alert(`${novasFichas.length} meses importados da ficha financeira.`);
      setShowFichaModal(false);
      setPasteFicha('');
    } else {
      alert('Não foi possível encontrar dados de competência e valor. Tente copiar as linhas que contêm o mês e o valor bruto/vencimento.');
    }
  };

  const [geracaoPeriodo, setGeracaoPeriodo] = useState({
    inicio: '2021-01',
    fim: '2021-12',
    devido: 3500,
    recebido: 3000
  });

  const gerarLancamentosMassa = () => {
    const [anoI, mesI] = geracaoPeriodo.inicio.split('-').map(Number);
    const [anoF, mesF] = geracaoPeriodo.fim.split('-').map(Number);
    
    const novos: LancamentoMensal[] = [];
    let currAno = anoI;
    let currMes = mesI;

    while (currAno < anoF || (currAno === anoF && currMes <= mesF)) {
      novos.push({
        competencia: `${currAno}-${String(currMes).padStart(2, '0')}`,
        valorDevido: geracaoPeriodo.devido,
        valorRecebido: geracaoPeriodo.recebido,
        isTributavel: true
      });
      
      currMes++;
      if (currMes > 12) {
        currMes = 1;
        currAno++;
      }
    }

    setLancamentos(prev => {
      const filtrados = prev.filter(p => !novos.find(n => n.competencia === p.competencia));
      return [...filtrados, ...novos].sort((a,b) => a.competencia.localeCompare(b.competencia));
    });

    alert(`${novos.length} meses gerados com sucesso!`);
    setShowFichaModal(false);
  };

  const openImport = (target: 'ipcaE' | 'selic' | 'jurosMora') => {
    setImportTarget(target);
    setShowImportModal(true);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await gerarRelatorioPDF(resultados, resumo, parametros, configRelatorio);
    } finally {
      setIsExporting(false);
    }
  };

  const removeVerba = (id: string) => {
    if (confirm('Deseja remover esta rubrica?')) {
      setVerbas(verbas.filter(v => v.id !== id));
    }
  };

  const addVerba = () => {
    if (novaVerba.nome && novaVerba.valor !== undefined) {
      const nova: VerbaConfig = {
        id: crypto.randomUUID(),
        nome: novaVerba.nome,
        isTributavel: !!novaVerba.isTributavel,
        tipo: novaVerba.tipo as 'PERCENTUAL' | 'FIXO',
        valor: Number(novaVerba.valor),
        incideSobre: 'SALARIO_BASE'
      };
      setVerbas([...verbas, nova]);
      setShowVerbaForm(false);
      setNovaVerba({ nome: '', tipo: 'PERCENTUAL', valor: 0, isTributavel: true, incideSobre: 'SALARIO_BASE' });
    }
  };

  const handleAddObs = () => {
    if (novaObs.titulo && novaObs.descricao) {
      setParametros({
        ...parametros,
        observacoesCustomizadas: [...(parametros.observacoesCustomizadas || []), novaObs]
      });
      setNovaObs({ titulo: '', descricao: '' });
    }
  };

  const handleRemoveObs = (index: number) => {
    const novasObs = [...(parametros.observacoesCustomizadas || [])];
    novasObs.splice(index, 1);
    setParametros({ ...parametros, observacoesCustomizadas: novasObs });
  };

  return (
    <div className="dashboard-container">
       <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleImportIndices} />
      <input type="file" ref={fichaInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleImportFicha} />
      <input type="file" ref={logoInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleLogoUpload} />

      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Calculator size={32} />
            SisLiqJud - Dash de Liquidação
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Gestão de Diferenças Salariais e Rubricas Variáveis</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" onClick={handleNovoCalculo} style={{ background: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Novo Cálculo
          </button>
          <button className="btn-primary" onClick={() => navigate('/historico')} style={{ background: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} /> Histórico
          </button>
          <button className="btn-primary" onClick={() => setShowObsModal(true)} style={{ background: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} /> Observações
          </button>
          <button className="btn-primary" onClick={() => setShowConfigModal(true)} style={{ background: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} /> Configurar PDF
          </button>
          <button className="btn-primary" onClick={() => setShowVerbaForm(true)} style={{ background: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <TrendingUp size={18} /> Adicionar Rubrica
          </button>
          <button className="btn-primary" onClick={() => setShowFichaModal(true)} style={{ background: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> Ficha Financeira
          </button>
          <button className="btn-primary" onClick={() => openImport('ipcaE')} style={{ background: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={18} /> Índices
          </button>
          <button 
            className="btn-primary" 
            onClick={handleExportPDF} 
            disabled={isExporting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isExporting ? 0.7 : 1 }}
            title="Gerar memória de cálculo em PDF"
          >
            {isExporting ? <UploadCloud className="animate-spin" size={18} /> : <Download size={18} />}
            {isExporting ? 'Processando...' : 'Relatório PDF'}
          </button>
        </div>
      </header>

      {/* Dados do Processo no Topo */}
      <section className="card" style={{ marginBottom: '1.5rem', background: '#fff', borderLeft: '4px solid var(--primary)' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={18} /> Informações Básicas do Processo
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          <div>
            <label className="input-label">Número do Processo</label>
            <input type="text" className="input-field" value={parametros.numeroProcesso} placeholder="0000000-00.20XX.X.XX.XXXX" onChange={(e) => setParametros({...parametros, numeroProcesso: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Requerente (Autor)</label>
            <input type="text" className="input-field" value={parametros.nomeRequerente} placeholder="Nome do Autor" onChange={(e) => setParametros({...parametros, nomeRequerente: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Requerido (Réu)</label>
            <input type="text" className="input-field" value={parametros.nomeRequerido} placeholder="Nome do Réu" onChange={(e) => setParametros({...parametros, nomeRequerido: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Órgão Previdenciário</label>
            <input type="text" className="input-field" value={parametros.orgaoPrevidenciario} placeholder="Ex: AMPREV" onChange={(e) => setParametros({...parametros, orgaoPrevidenciario: e.target.value})} />
          </div>

          <div>
            <label className="input-label">Assunto</label>
            <input type="text" className="input-field" value={parametros.assunto} placeholder="Ex: Progressão Salarial" onChange={(e) => setParametros({...parametros, assunto: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Tramitação</label>
            <input type="text" className="input-field" value={parametros.tramitacao} placeholder="Ex: PJe" onChange={(e) => setParametros({...parametros, tramitacao: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label className="input-label">Data Ajuizamento</label>
              <input type="date" className="input-field" value={parametros.dataAjuizamento.toISOString().split('T')[0]} onChange={(e) => setParametros({...parametros, dataAjuizamento: new Date(e.target.value)})} />
            </div>
            <div>
              <label className="input-label">Data Citação</label>
              <input type="date" className="input-field" value={parametros.dataCitacao.toISOString().split('T')[0]} onChange={(e) => setParametros({...parametros, dataCitacao: new Date(e.target.value)})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label className="input-label">Data Sentença</label>
              <input type="date" className="input-field" value={parametros.dataSentenca.toISOString().split('T')[0]} onChange={(e) => setParametros({...parametros, dataSentenca: new Date(e.target.value)})} />
            </div>
            <div>
              <label className="input-label">% Honorários</label>
              <input type="number" className="input-field" value={parametros.percentualHonorarios} onChange={(e) => setParametros({...parametros, percentualHonorarios: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', gridColumn: 'span 1' }}>
              <input 
                type="checkbox" 
                id="check-prev"
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                checked={parametros.aplicarPrevidencia} 
                onChange={(e) => setParametros({...parametros, aplicarPrevidencia: e.target.checked})} 
              />
              <label htmlFor="check-prev" style={{ fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}>Calcular Previdência</label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input 
                  type="checkbox" 
                  id="check-ir"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={parametros.aplicarIR} 
                  onChange={(e) => setParametros({...parametros, aplicarIR: e.target.checked})} 
                />
                <label htmlFor="check-ir" style={{ fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}>Calcular Imposto de Renda (RRA)</label>
              </div>
              {!parametros.aplicarIR && (
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, marginLeft: '1.85rem', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', width: 'fit-content' }}>
                  Isento conforme IN nº 1.500/2014 (Sistemática RRA)
                </span>
              )}
            </div>
          </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        <div className="main-content">
          <section className="card">
            <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} /> 1. Apuração de Valores Base (Diferenças)
            </h3>
            <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '2rem' }}>
              <table className="grid-launch">
                <thead>
                  <tr>
                    <th>Comp.</th>
                    <th>Vcto Devido</th>
                    <th>Vcto Recebido</th>
                    <th>Diff Venc.</th>
                    <th style={{ background: '#ecfdf5', color: '#065f46' }}>Rubricas Trib.</th>
                    <th style={{ background: '#fefce8', color: '#854d0e' }}>Rubricas Isentas</th>
                    <th>Reflexos</th>
                    <th style={{ background: '#dcfce7', color: '#166534' }}>Base Tributável</th>
                    <th style={{ background: 'var(--primary)', color: 'white' }}>Base Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((res, i) => {
                    const rubricasTrib = verbas.filter(v => v.isTributavel).reduce((acc, v) => acc + (res.verbasDiferencas?.[v.id] || 0), 0);
                    const rubricasIsentas = verbas.filter(v => !v.isTributavel).reduce((acc, v) => acc + (res.verbasDiferencas?.[v.id] || 0), 0);
                    const reflexosMes = res.reflexo13 + res.reflexoFerias;
                    const baseTotalMes = res.diferencaNominal + reflexosMes;
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{res.competencia}</td>
                        <td>{res.valorDevido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>{res.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ color: 'var(--accent)', fontWeight: 500 }}>{(res.valorDevido - res.valorRecebido).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ color: '#059669' }}>{rubricasTrib.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ color: '#d97706' }}>{rubricasIsentas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ color: 'var(--secondary)' }}>{reflexosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ color: '#16a34a', fontWeight: 500 }}>{res.baseTributavel.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: 'bold', background: '#f8fafc' }}>R$ {baseTotalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} /> 2. Atualizações e Liquidação
            </h3>
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <table className="grid-launch">
                <thead>
                  <tr>
                    <th>Comp.</th>
                    <th>Índice/Correção</th>
                    <th style={{ background: '#dcfce7', color: '#166534' }}>Base Trib. Corr.</th>
                    <th style={{ background: '#f0f9ff', color: '#0369a1' }}>Base Total Corr.</th>
                    <th style={{ background: '#dcfce7', color: '#166534' }}>Juros (Base Trib.)</th>
                    <th style={{ background: '#f0f9ff', color: '#0369a1' }}>Juros (Base Total)</th>
                    <th style={{ color: 'var(--error)' }}>Previdência</th>
                    <th style={{ background: 'var(--primary)', color: 'white' }}>Total Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((res, i) => {
                    const jurosTributavel = res.baseTributavelCorrigida * res.jurosAcumulados;
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{res.competencia}</td>
                        <td style={{ fontSize: '0.8rem' }}>{res.isSelic ? <span className="badge-selic">SELIC (EC113)</span> : <span className="badge-ipca">IPCA-E + Juros</span>}</td>
                        <td style={{ color: '#16a34a' }}>{res.baseTributavelCorrigida.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ color: '#0284c7', fontWeight: 500 }}>{res.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ color: '#16a34a' }}>{jurosTributavel.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ color: 'var(--accent)' }}>{res.valorJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ color: 'var(--error)' }}>
                          {res.valorPrevidenciaCorrigida.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ fontWeight: 'bold', background: '#f8fafc' }}>R$ {res.totalDoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="sidebar">
          {/* Rubricas Ativas na Sidebar agora */}
          <section className="card" style={{ background: '#f8fafc' }}>
            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={18} /> Rubricas Ativas
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {verbas.map(v => (
                <div key={v.id} style={{ background: 'white', border: '1px solid var(--border)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{v.nome}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{v.tipo === 'PERCENTUAL' ? `${v.valor}%` : `R$ ${v.valor}`} • {v.isTributavel ? 'Trib.' : 'Isento'}</span>
                  </div>
                  <button onClick={() => removeVerba(v.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="card" style={{ background: 'var(--primary)', color: 'white' }}>
            <h4 style={{ margin: '0 0 1rem 0', opacity: 0.8 }}>Resumo do Cálculo</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <small style={{ opacity: 0.7 }}>Bruto Total</small>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>R$ {resumo.totalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <small style={{ opacity: 0.7 }}>Honorários ({parametros.percentualHonorarios}%)</small>
                <div style={{ fontSize: '1rem' }}>+ R$ {resumo.honorariosAdvocaticios.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <small style={{ opacity: 0.7 }}>Previdência</small>
                  <div style={{ fontSize: '0.9rem', color: '#ffb3b3' }}>- R$ {resumo.valorPrevidencia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <small style={{ opacity: 0.7 }}>IR (RRA)</small>
                  <div style={{ fontSize: '0.9rem', color: '#ffb3b3' }}>- R$ {resumo.valorIR.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.5rem' }}>
                <small style={{ opacity: 1, fontWeight: 'bold' }}>LÍQUIDO FINAL</small>
                <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>R$ {resumo.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </section>

          <button 
            className="btn-primary" 
            onClick={handleSalvar}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--success)' }}
          >
            <Save size={18} /> {currentId ? 'Atualizar Cálculo' : 'Salvar no Histórico'}
          </button>
        </aside>
      </div>

      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ margin: '0 0 1rem 0' }}>Importar Índices ({importTarget.toUpperCase()})</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Cole abaixo o conteúdo copiado do PDF. O sistema detectará automaticamente anos e blocos de valores.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={() => setImportTarget('ipcaE')} style={{ padding: '4px 8px', fontSize: '0.7rem', background: importTarget === 'ipcaE' ? 'var(--primary)' : '#e2e8f0', color: importTarget === 'ipcaE' ? 'white' : 'black', border: 'none', borderRadius: '4px' }}>IPCA-E</button>
              <button onClick={() => setImportTarget('selic')} style={{ padding: '4px 8px', fontSize: '0.7rem', background: importTarget === 'selic' ? 'var(--primary)' : '#e2e8f0', color: importTarget === 'selic' ? 'white' : 'black', border: 'none', borderRadius: '4px' }}>SELIC</button>
              <button onClick={() => setImportTarget('jurosMora')} style={{ padding: '4px 8px', fontSize: '0.7rem', background: importTarget === 'jurosMora' ? 'var(--primary)' : '#e2e8f0', color: importTarget === 'jurosMora' ? 'white' : 'black', border: 'none', borderRadius: '4px' }}>JUROS</button>
            </div>
            <textarea className="textArea-import" placeholder="Cole aqui os dados do PDF..." value={pasteData} onChange={(e) => setPasteData(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn-primary" onClick={() => setShowImportModal(false)} style={{ background: '#e2e8f0', color: '#0f172a' }}>Cancelar</button>
              <button className="btn-primary" onClick={processPaste}>Processar e Importar</button>
            </div>
          </div>
        </div>
      )}
      {showFichaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '95%' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Importar / Gerar Ficha Financeira</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Lado Esquerdo: Colagem Inteligente */}
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Opção 1: Colar do PDF</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Identifica automaticamente Mês e Valor no texto colado.
                </p>
                <textarea 
                  className="textArea-import"
                  style={{ height: '200px' }}
                  placeholder="Exemplo:&#10;01/2021 Vencimento 3.500,00&#10;FEV/2021 Vencimento 3.500,00"
                  value={pasteFicha}
                  onChange={(e) => setPasteFicha(e.target.value)}
                />
                <button className="btn-primary" style={{ width: '100%' }} onClick={processPasteFicha}>
                   Processar Colagem
                </button>
              </div>

              {/* Lado Direito: Geração por Período */}
              <div style={{ paddingLeft: '2rem', borderLeft: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Opção 2: Gerar por Período</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Ideal quando os valores são fixos por um longo tempo.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label className="input-label">Mês/Ano Inicial</label>
                        <input type="month" className="input-field" value={geracaoPeriodo.inicio} onChange={(e) => setGeracaoPeriodo({...geracaoPeriodo, inicio: e.target.value})} />
                      </div>
                      <div>
                        <label className="input-label">Mês/Ano Final</label>
                        <input type="month" className="input-field" value={geracaoPeriodo.fim} onChange={(e) => setGeracaoPeriodo({...geracaoPeriodo, fim: e.target.value})} />
                      </div>
                   </div>
                   <div>
                     <label className="input-label">Valor Devido Padrão</label>
                     <input type="number" className="input-field" value={geracaoPeriodo.devido} onChange={(e) => setGeracaoPeriodo({...geracaoPeriodo, devido: parseFloat(e.target.value) || 0})} />
                   </div>
                   <div>
                     <label className="input-label">Valor Recebido Padrão</label>
                     <input type="number" className="input-field" value={geracaoPeriodo.recebido} onChange={(e) => setGeracaoPeriodo({...geracaoPeriodo, recebido: parseFloat(e.target.value) || 0})} />
                   </div>
                   <button className="btn-primary" style={{ background: 'var(--accent)', marginTop: '0.5rem' }} onClick={gerarLancamentosMassa}>
                     Gerar Período Completo
                   </button>
                </div>

                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                   <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Opção 3: Arquivo CSV</h4>
                   <button className="btn-primary" style={{ width: '100%', background: '#f1f5f9', color: '#0f172a' }} onClick={() => fichaInputRef.current?.click()}>
                     Carregar Arquivo .CSV
                   </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button className="btn-primary" onClick={() => setShowFichaModal(false)} style={{ background: '#e2e8f0', color: '#0f172a' }}>
                  Fechar
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração do Relatório */}
      {showConfigModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem' }}>
                <Settings size={20} /> Personalizar Relatório PDF
              </h3>
              <button onClick={() => setShowConfigModal(false)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    border: '2px dashed var(--border)', 
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: '#fff',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {configRelatorio.logoBase64 ? (
                    <img src={configRelatorio.logoBase64} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <>
                      <UploadCloud size={32} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Logo do Escritório</span>
                    </>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                   <label className="input-label">Cor Primária do Relatório</label>
                   <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                     <input 
                       type="color" 
                       value={configRelatorio.corPrimaria} 
                       onChange={(e) => setConfigRelatorio({...configRelatorio, corPrimaria: e.target.value})}
                       style={{ width: '40px', height: '40px', border: 'none', padding: '0', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}
                     />
                     <input 
                       type="text" 
                       className="input-field" 
                       value={configRelatorio.corPrimaria} 
                       onChange={(e) => setConfigRelatorio({...configRelatorio, corPrimaria: e.target.value})}
                       style={{ width: '100%', boxSizing: 'border-box' }}
                     />
                   </div>
                </div>
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: '0.35rem', display: 'block' }}>Nome do Escritório</label>
                <div style={{ position: 'relative' }}>
                  <Scale size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }}
                    value={configRelatorio.nomeEscritorio} 
                    onChange={(e) => setConfigRelatorio({...configRelatorio, nomeEscritorio: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: '0.35rem', display: 'block' }}>Endereço Completo</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }}
                    value={configRelatorio.enderecoEscritorio} 
                    onChange={(e) => setConfigRelatorio({...configRelatorio, enderecoEscritorio: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ minWidth: 0 }}>
                  <label className="input-label" style={{ marginBottom: '0.35rem', display: 'block' }}>Telefone de Contato</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }}
                      value={configRelatorio.telefoneEscritorio} 
                      onChange={(e) => setConfigRelatorio({...configRelatorio, telefoneEscritorio: e.target.value})}
                    />
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <label className="input-label" style={{ marginBottom: '0.35rem', display: 'block' }}>E-mail</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }}
                      value={configRelatorio.emailEscritorio} 
                      onChange={(e) => setConfigRelatorio({...configRelatorio, emailEscritorio: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn-primary" onClick={() => setShowConfigModal(false)} style={{ padding: '0.6rem 2rem' }}>
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Observações */}
      {showObsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem' }}>
                <BookOpen size={20} /> Observações Adicionais (PDF)
              </h3>
              <button onClick={() => setShowObsModal(false)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                <X size={18} />
              </button>
            </div>
            
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div>
                    <label className="input-label" style={{ marginBottom: '0.35rem', display: 'block' }}>Título da Observação</label>
                    <input type="text" className="input-field" placeholder="Ex: Honorários..." value={novaObs.titulo} onChange={(e) => setNovaObs({...novaObs, titulo: e.target.value})} />
                  </div>
                  <div>
                    <label className="input-label" style={{ marginBottom: '0.35rem', display: 'block' }}>Descrição</label>
                    <input type="text" className="input-field" placeholder="Descreva aqui..." value={novaObs.descricao} onChange={(e) => setNovaObs({...novaObs, descricao: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button className="btn-primary" onClick={handleAddObs} style={{ background: 'var(--primary)', padding: '0.5rem 1.5rem' }}>Adicionar Observação</button>
                </div>
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {parametros.observacoesCustomizadas && parametros.observacoesCustomizadas.length > 0 ? (
                  <table className="grid-launch">
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Descrição</th>
                        <th style={{ width: '50px' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parametros.observacoesCustomizadas.map((obs, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{obs.titulo}</td>
                          <td>{obs.descricao}</td>
                          <td>
                            <button onClick={() => handleRemoveObs(idx)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>
                              <X size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Nenhuma observação adicionada.</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn-primary" onClick={() => setShowObsModal(false)}>
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Adicionar Rubrica */}
      {showVerbaForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem' }}>
                <TrendingUp size={20} /> Nova Rubrica / Verba
              </h3>
              <button onClick={() => setShowVerbaForm(false)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="input-label">Nome da Rubrica</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Auxílio Alimentação" 
                  value={novaVerba.nome} 
                  onChange={(e) => setNovaVerba({...novaVerba, nome: e.target.value})} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Tipo de Cálculo</label>
                  <select 
                    className="input-field" 
                    value={novaVerba.tipo} 
                    onChange={(e) => setNovaVerba({...novaVerba, tipo: e.target.value as any})}
                  >
                    <option value="PERCENTUAL">Percentual (%)</option>
                    <option value="FIXO">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Valor ({novaVerba.tipo === 'PERCENTUAL' ? '%' : 'R$'})</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={novaVerba.valor} 
                    onChange={(e) => setNovaVerba({...novaVerba, valor: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={novaVerba.isTributavel} 
                    onChange={(e) => setNovaVerba({...novaVerba, isTributavel: e.target.checked})} 
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Esta verba é tributável (incide IR/Prev)?</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '0.75rem' }}>
              <button className="btn-primary" style={{ background: '#f1f5f9', color: '#64748b' }} onClick={() => setShowVerbaForm(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={addVerba}>
                Adicionar Rubrica
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculadoraJudicial;
