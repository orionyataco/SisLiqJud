import React, { useState, useEffect } from 'react';
import { listarCalculos, deletarCalculo } from '../logic/storage';
import { CalculoSalvo } from '../logic/types';
import { Search, Trash2, Edit, Plus, FileText, Calendar, Calculator, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HistoricoCalculos: React.FC = () => {
  const [calculos, setCalculos] = useState<CalculoSalvo[]>([]);
  const [filtro, setFiltro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setCalculos(listarCalculos());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este cálculo?')) {
      deletarCalculo(id);
      setCalculos(listarCalculos());
    }
  };

  const filteredCalculos = calculos.filter(c => 
    c.parametros.nomeRequerente.toLowerCase().includes(filtro.toLowerCase()) ||
    c.parametros.numeroProcesso.toLowerCase().includes(filtro.toLowerCase()) ||
    (c.parametros.assunto || '').toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <header style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ flex: '1 1 auto', minWidth: '300px' }}>
          <h1 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Calculator size={32} style={{ flexShrink: 0 }} />
            <span>SisLiqJud - Histórico de Cálculos</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Gerencie e recupere liquidações salvas no sistema</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/')}
            style={{ background: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={18} /> Voltar
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/')}
            style={{ background: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} /> Novo Cálculo
          </button>
        </div>
      </header>

      <section className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--background)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Pesquisar por requerente, processo ou assunto..."
              className="input-field"
              style={{ paddingLeft: '40px' }}
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {filteredCalculos.length} registros encontrados
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="grid-launch">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Requerente / Processo</th>
                <th style={{ width: '25%' }}>Assunto</th>
                <th style={{ width: '15%' }}>Valor Líquido</th>
                <th style={{ width: '15%' }}>Data Atualização</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalculos.length > 0 ? (
                filteredCalculos.map((c) => (
                  <tr 
                    key={c.id} 
                    className="hover-row"
                    onClick={() => navigate(`/?edit=${c.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{c.parametros.nomeRequerente}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.parametros.numeroProcesso}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{c.parametros.assunto || 'N/I'}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                        {c.resumo.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Calendar size={14} />
                        {new Date(c.dataAtualizacao).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button 
                          className="btn-action"
                          style={{ color: 'var(--accent)', background: 'rgba(37, 99, 235, 0.1)', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                          title="Editar Cálculo"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(c.id, e)}
                          className="btn-action"
                          style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                          title="Excluir Registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                      <FileText size={48} style={{ opacity: 0.2 }} />
                      <p style={{ margin: 0 }}>{filtro ? 'Nenhum cálculo encontrado para sua busca.' : 'Nenhum cálculo salvo ainda.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .hover-row:hover td {
          background-color: #f1f5f9 !important;
        }
        .btn-action {
          transition: all 0.2s;
        }
        .btn-action:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default HistoricoCalculos;
