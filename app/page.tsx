"use client";
import { useEffect, useState } from "react";
import Management from "./management";
import { supabase } from "@/lib/supabase";
export default function Home() {
  const [ready,setReady]=useState(false),[signedIn,setSignedIn]=useState(false),[register,setRegister]=useState(false),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSignedIn(!!data.session);setReady(true)});const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setSignedIn(!!session));return ()=>subscription.unsubscribe()},[]);
  async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setMessage("");try{const {data,error}=register?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});if(error)throw error;if(register&&!data.session)setMessage("Conta criada. Confira seu email para confirmar o cadastro antes de entrar.")}catch(error){setMessage(error instanceof Error?error.message:"Não foi possível entrar.")}finally{setBusy(false)}}
  if(!ready)return <div className="auth-page"><p>Carregando…</p></div>;
  if(signedIn)return <Management/>;
  return <main className="auth-page"><div className="auth-card"><div className="auth-logo">IB</div><span className="eyebrow">GESTÃO PARA BATATARIAS</span><h1>{register?"Criar conta":"Entrar na sua conta"}</h1><p>Vendas, fichas técnicas, finanças e estoque em um só lugar.</p><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Senha<input type="password" autoComplete={register?"new-password":"current-password"} minLength={6} required value={password} onChange={e=>setPassword(e.target.value)}/></label>{message&&<div className="auth-message" role="status">{message}</div>}<button className="primary" disabled={busy}>{busy?"Aguarde…":register?"Criar conta":"Entrar"}</button></form><button className="auth-switch" onClick={()=>{setRegister(!register);setMessage("")}}>{register?"Já tenho uma conta":"Criar uma conta nova"}</button></div></main>;
}
