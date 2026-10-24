"use client";
import { useState } from "react";

type Feedback = { score: number; summary: string; strengths: string[]; improvements: string[]; action_plan: string[] };

const prompts = [
  "Os desafios para combater a desinformação científica no Brasil",
  "Caminhos para ampliar a permanência de jovens na escola pública",
  "Impactos da desigualdade de acesso às tecnologias digitais",
];

export default function EssayWorkspace() {
  const [prompt, setPrompt] = useState(prompts[0]);
  const [title, setTitle] = useState("");
  const [essay, setEssay] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const words = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  async function correct() {
    setMessage("");
    setFeedback(null);
    setBusy(true);
    try {
      const response = await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "Redação sem título", prompt, essay }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível corrigir agora.");
      setFeedback(data.feedback);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível corrigir agora.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="essay-workspace">
      <div className="essay-header">
        <div><span className="eyebrow">Laboratório de redação</span><h2>Escreva, receba um diagnóstico e revise.</h2><p>Use a correção como orientação de estudo. A nota é estimativa pedagógica, não avaliação oficial.</p></div>
        <span className="essay-badge">{words} palavras</span>
      </div>
      <div className="essay-grid">
        <form className="form-card essay-editor" onSubmit={(event) => { event.preventDefault(); void correct(); }}>
          <label className="field">Tema
            <select value={prompt} onChange={(event) => setPrompt(event.target.value)}>{prompts.map((item) => <option key={item}>{item}</option>)}</select>
          </label>
          <label className="field">Título opcional<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Minha proposta de intervenção" /></label>
          <label className="field">Seu texto<textarea value={essay} onChange={(event) => setEssay(event.target.value)} minLength={100} maxLength={12000} required rows={18} placeholder="Comece sua redação aqui..." /></label>
          <div className="essay-actions"><span className="subtle">Mínimo recomendado: 100 palavras.</span><button className="button primary" disabled={busy || words < 100}>{busy ? "Analisando…" : "Corrigir redação"}</button></div>
          <p role="status" className="error" hidden={!message}>{message}</p>
        </form>
        <aside className="essay-side">
          <span className="eyebrow">Como melhorar</span>
          <h3>Checklist antes de enviar</h3>
          <ul className="task-list"><li>Apresente uma tese clara.</li><li>Conecte argumentos ao tema.</li><li>Detalhe agente, ação e finalidade.</li><li>Revise coesão, pontuação e norma-padrão.</li></ul>
        </aside>
      </div>
      {feedback && <section className="essay-feedback" aria-live="polite"><div className="feedback-score"><span>Diagnóstico estimado</span><strong>{feedback.score}</strong><small>/ 1000</small></div><div><span className="eyebrow">Leitura geral</span><p>{feedback.summary}</p><div className="feedback-columns"><div><h3>Pontos fortes</h3><ul>{feedback.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3>Próximos ajustes</h3><ul>{feedback.improvements.map((item) => <li key={item}>{item}</li>)}</ul></div></div><h3>Plano de revisão</h3><ol>{feedback.action_plan.map((item) => <li key={item}>{item}</li>)}</ol></div></section>}
    </div>
  );
}
