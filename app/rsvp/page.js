'use client';

import { useState } from 'react';

// Função utilitária para aplicar a máscara de telefone (00) 00000-0000 automaticamente
const formatarTelefone = (value) => {
  if (!value) return value;
  
  // Remove qualquer caractere que não seja número
  const apenasNumeros = value.replace(/\D/g, '');
  
  // Se tiver até 2 números, formata como: (11
  if (apenasNumeros.length <= 2) {
    return `(${apenasNumeros}`;
  }
  
  // Se tiver até 7 números, formata como: (11) 9999
  if (apenasNumeros.length <= 7) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
  }
  
  // Se for celular completo (11 dígitos), formata como: (11) 99999-9999
  return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`;
};

export default function RsvpPage() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [idadePrincipal, setIdadePrincipal] = useState('');
  const [confirma, setConfirma] = useState('Sim');
  const [acompanhantes, setAcompanhantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Função para adicionar um novo bloco de acompanhante
  const adicionarAcompanhante = () => {
    setAcompanhantes([...acompanhantes, { nome: '', idade: '' }]);
  };

  // Função para atualizar os dados de um acompanhante específico
  const atualizarAcompanhante = (index, campo, valor) => {
    const novosAcompanhantes = [...acompanhantes];
    novosAcompanhantes[index][campo] = valor;
    setAcompanhantes(novosAcompanhantes);
  };

  // Função para remover um acompanhante da lista
  const removerAcompanhante = (index) => {
    const novosAcompanhantes = acompanhantes.filter((_, i) => i !== index);
    setAcompanhantes(novosAcompanhantes);
  };

  // Envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('');

    const dadosFormulario = {
      nomePrincipal: nome,
      telefone,
      idadePrincipal,
      confirmaPresenca: confirma,
      acompanhantes: confirma === 'Sim' ? acompanhantes : [],
    };

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosFormulario),
      });

      const resultado = await response.json();

      if (resultado.success) {
        setStatusMessage('✨ Presença confirmada com sucesso!');
        setNome('');
        setTelefone('');
        setIdadePrincipal('');
        setConfirma('Sim');
        setAcompanhantes([]);
      } else {
        setStatusMessage('❌ Erro ao enviar. Tente novamente mais tarde.');
      }
    } catch (error) {
      setStatusMessage('❌ Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 flex flex-col justify-center items-center font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
        
        {/* Cabeçalho do Card */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">15 Anos da Vitória</h1>
          <p className="text-sm text-slate-500">Confirme sua presença nos campos abaixo.</p>
          <p className="text-sm text-slate-500">Confirmar presença até o dia</p><h1 className="text-4xl md:text-2xl font-bold text-slate-800 tracking-tight">05/08/2026</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
          
          {/* Nome do Convidado Principal */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-semibold text-slate-700 ml-1">Nome completo do convidado principal</label>
            <input
              type="text"
              required
              placeholder="Digite seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white transition-all text-base"
            />
          </div>

          {/* Telefone para Contato com Máscara */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-semibold text-slate-700 ml-1">Telefone para contato</label>
            <input
              type="tel"
              required
              maxLength={15}
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white transition-all text-base"
            />
          </div>

          {/* Idade do Convidado Principal */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-semibold text-slate-700 ml-1">Sua idade</label>
            <input
              type="number"
              required
              min="0"
              max="120"
              placeholder="Ex: 25"
              value={idadePrincipal}
              onChange={(e) => setIdadePrincipal(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white transition-all text-base"
            />
          </div>

          {/* Botões de Confirmação de Presença */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Confirmará presença?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirma('Sim')}
                className={`py-4 rounded-2xl font-bold transition-all border text-sm md:text-base ${
                  confirma === 'Sim'
                    ? 'bg-pink-500 text-white border-pink-500 shadow-md'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                Sim, com certeza!
              </button>
              <button
                type="button"
                onClick={() => setConfirma('Não')}
                className={`py-4 rounded-2xl font-bold transition-all border text-sm md:text-base ${
                  confirma === 'Não'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                Não poderei ir
              </button>
            </div>
          </div>

          {/* Seção Dinâmica de Acompanhantes */}
          {confirma === 'Sim' && (
            <div className="pt-4 space-y-4">
              <div className="px-1">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Acompanhantes</h3>
              </div>

              {/* Lista de Acompanhantes (Aparece acima) */}
              {acompanhantes.length > 0 && (
                <div className="space-y-4">
                  {acompanhantes.map((acompanhante, index) => (
                    <div key={index} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-4">
                      
                      {/* Botão de Remover Acompanhante */}
                      <button
                        type="button"
                        onClick={() => removerAcompanhante(index)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-red-500 p-1 transition-colors"
                        title="Remover"
                      >
                        ✕
                      </button>

                      {/* Nome do Acompanhante */}
                      <div className="flex flex-col space-y-1">
                        <label className="text-xs font-bold text-slate-600">Nome do acompanhante {index + 1}</label>
                        <input
                          type="text"
                          required
                          placeholder="Nome completo"
                          value={acompanhante.nome}
                          onChange={(e) => atualizarAcompanhante(index, 'nome', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 focus:ring-2 focus:ring-pink-300 focus:outline-none"
                        />
                      </div>

                      {/* Idade do Acompanhante */}
                      <div className="flex flex-col space-y-1">
                        <label className="text-xs font-bold text-slate-600">Idade</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="120"
                          placeholder="Ex: 12"
                          value={acompanhante.idade}
                          onChange={(e) => atualizarAcompanhante(index, 'idade', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 focus:ring-2 focus:ring-pink-300 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {acompanhantes.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-2">Nenhum acompanhante adicionado.</p>
              )}

              {/* Botão de Adicionar - Sempre na parte inferior */}
              <div className="flex justify-end pr-1">
                <button
                  type="button"
                  onClick={adicionarAcompanhante}
                  className="text-xs font-bold text-pink-600 bg-pink-50 px-4 py-2 rounded-xl border border-pink-100 active:scale-95 transition-transform shadow-sm"
                >
                  + Adicionar
                </button>
              </div>
            </div>
          )}

          <hr className="border-slate-100" />

          {/* Botão de Enviar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 transition-all active:scale-[0.98] disabled:opacity-50 text-lg"
          >
            {loading ? 'Processando...' : 'Confirmar Presença'}
          </button>

          {/* Mensagem de Feedback */}
          {statusMessage && (
            <p className={`text-center text-sm font-medium p-3 rounded-xl ${
              statusMessage.includes('sucesso') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {statusMessage}
            </p>
          )}

        </form>
      </div>
    </div>
  );
}