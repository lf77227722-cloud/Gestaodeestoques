"use client";

import { useEffect, useState } from "react";
import Management from "./management";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register" | "forgot" | "recovery";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setMode("recovery");
      setSignedIn(!!session);
      setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  function changeMode(next: Mode) {
    setMode(next);
    setPassword("");
    setConfirmation("");
    setMessage("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage("Se este email estiver cadastrado, você receberá um link para criar uma nova senha.");
      } else if (mode === "recovery") {
        if (password !== confirmation) throw new Error("As senhas não coincidem.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await supabase.auth.signOut();
        changeMode("login");
        setMessage("Senha alterada. Entre com sua nova senha.");
      } else if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) setMessage("Conta criada. Se a confirmação de email ainda estiver ativa no Supabase, confira sua caixa de entrada.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível concluir. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <div className="auth-page"><p>Carregando…</p></div>;
  if (signedIn && mode !== "recovery") return <Management />;

  const title = { login: "Entrar na sua conta", register: "Criar conta", forgot: "Recuperar senha", recovery: "Criar nova senha" }[mode];
  return <main className="auth-page"><div className="auth-card">
    <div className="auth-logo">IB</div>
    <span className="eyebrow">GESTÃO PARA BATATARIAS</span>
    <h1>{title}</h1>
    <p>{mode === "forgot" ? "Informe o email da sua conta para receber um link de recuperação." : mode === "recovery" ? "Escolha uma nova senha para sua conta." : "Vendas, fichas técnicas, finanças e estoque em um só lugar."}</p>
    <form onSubmit={submit}>
      {mode !== "recovery" && <label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>}
      {mode !== "forgot" && <label>{mode === "recovery" ? "Nova senha" : "Senha"}<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={e => setPassword(e.target.value)} /></label>}
      {mode === "recovery" && <label>Confirme a nova senha<input type="password" autoComplete="new-password" minLength={6} required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>}
      {message && <div className="auth-message" role="status">{message}</div>}
      <button className="primary" disabled={busy}>{busy ? "Aguarde…" : { login: "Entrar", register: "Criar conta", forgot: "Enviar link", recovery: "Salvar nova senha" }[mode]}</button>
    </form>
    {mode === "login" && <><button className="auth-switch" onClick={() => changeMode("forgot")}>Esqueci minha senha</button><button className="auth-switch" onClick={() => changeMode("register")}>Criar uma conta nova</button></>}
    {(mode === "register" || mode === "forgot") && <button className="auth-switch" onClick={() => changeMode("login")}>Voltar para entrar</button>}
  </div></main>;
}
